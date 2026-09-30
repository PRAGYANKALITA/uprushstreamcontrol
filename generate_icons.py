import zlib
import struct
import math
import os

def create_png(width, height, pixel_func, output_path):
    # pixel_func(x, y) returns (r, g, b, a) in 0..255
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = pixel_func(x, y, width, height)
            raw_data.extend([int(r), int(g), int(b), int(a)])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def chunk(tag, data):
        c = tag + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    # IHDR
    png.extend(chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)))
    # IDAT
    png.extend(chunk(b'IDAT', compressed))
    # IEND
    png.extend(chunk(b'IEND', b''))
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(png)
    print(f"Generated {output_path} ({width}x{height})")

def render_icon_pixel(x, y, w, h, is_maskable=False):
    # Normalized coordinates -1 to 1
    nx = (x / (w - 1)) * 2 - 1
    ny = (y / (h - 1)) * 2 - 1
    
    # Scale coordinates so maskable padding is preserved
    scale = 0.85 if is_maskable else 0.95
    nx /= scale
    ny /= scale
    
    dist_sq = nx * nx + ny * ny
    dist = math.sqrt(dist_sq)
    
    # Background: dark sci-fi esports theme (#0a0e17 -> #121826)
    bg_r = int(10 + 8 * (ny + 1) * 0.5)
    bg_g = int(14 + 10 * (ny + 1) * 0.5)
    bg_b = int(23 + 15 * (ny + 1) * 0.5)
    
    # Rounded badge box
    corner_r = 0.25
    dx = max(0, abs(nx) - (1.0 - corner_r))
    dy = max(0, abs(ny) - (1.0 - corner_r))
    outside_dist = math.sqrt(dx * dx + dy * dy)
    
    if not is_maskable and (outside_dist > corner_r or abs(nx) > 1.0 or abs(ny) > 1.0):
        # Anti-aliased edge
        edge = outside_dist - corner_r
        if edge > 0.05:
            return 0, 0, 0, 0
        alpha = max(0.0, min(1.0, 1.0 - edge / 0.05))
        return bg_r, bg_g, bg_b, int(alpha * 255)
    
    # Base color
    r, g, b, a = bg_r, bg_g, bg_b, 255
    
    # Cyber glow border
    if 0.85 < max(abs(nx), abs(ny)) < 0.95 or (0.8 < outside_dist < 0.9):
        # Cyan highlight
        glow = math.sin((nx + ny) * 3) * 0.3 + 0.7
        r = int(r * (1 - glow) + 0 * glow)
        g = int(g * (1 - glow) + 229 * glow)
        b = int(b * (1 - glow) + 255 * glow)
        return r, g, b, 255

    # Center Esports Trophy / Controller Icon Shape
    # Trophy Cup
    # Top rim: y in [-0.45, -0.4], x in [-0.4, 0.4]
    in_cup = False
    # Cup body: upper wider, narrowing to stem
    if -0.4 <= ny <= 0.1:
        cup_width = 0.4 - 0.2 * ((ny + 0.4) / 0.5) ** 1.5
        if abs(nx) <= cup_width:
            in_cup = True
            
    # Cup handles
    if -0.35 <= ny <= 0.0:
        h_outer = 0.55
        h_inner = 0.42
        if h_inner <= abs(nx) <= h_outer:
            in_cup = True
            
    # Stem:
    if 0.1 < ny <= 0.35:
        if abs(nx) <= 0.09:
            in_cup = True
            
    # Base:
    if 0.35 < ny <= 0.55:
        base_w = 0.1 + 0.3 * ((ny - 0.35) / 0.2)
        if abs(nx) <= base_w:
            in_cup = True

    # Star / Crown inside cup
    in_star = False
    if -0.25 <= ny <= -0.05 and abs(nx) <= 0.18:
        # Diamond / star shape
        if abs(nx) + abs(ny + 0.15) <= 0.14:
            in_star = True

    if in_star:
        # Bright Glowing Gold/White Star
        return 255, 255, 230, 255
    elif in_cup:
        # Gradient Gold / Cyber Cyan Trophy
        t_y = (ny + 0.5) / 1.1
        # Gold gradient (#fbbf24 to #f59e0b and cyan accents)
        gold_r = int(251 - 30 * t_y)
        gold_g = int(191 - 50 * t_y)
        gold_b = int(36 + 80 * t_y)
        # Highlight on left side
        if nx < -0.05:
            gold_r = min(255, gold_r + 40)
            gold_g = min(255, gold_g + 40)
            gold_b = min(255, gold_b + 40)
        return gold_r, gold_g, gold_b, 255

    # Glowing crosshair or tech dots in background
    if abs(nx) < 0.02 and abs(ny) > 0.65 and abs(ny) < 0.8:
        return 0, 229, 255, 200
    if abs(ny) < 0.02 and abs(nx) > 0.65 and abs(nx) < 0.8:
        return 0, 229, 255, 200

    return r, g, b, a

def generate_all():
    icons = [
        (192, 192, False, 'icons/icon-192.png'),
        (512, 512, False, 'icons/icon-512.png'),
        (192, 192, True, 'icons/icon-maskable-192.png'),
        (512, 512, True, 'icons/icon-maskable-512.png'),
        (180, 180, False, 'icons/apple-touch-icon.png'),
        (64, 64, False, 'icons/favicon-64.png')
    ]
    for w, h, maskable, path in icons:
        create_png(w, h, lambda x, y, width, height, m=maskable: render_icon_pixel(x, y, width, height, m), path)

if __name__ == '__main__':
    generate_all()
