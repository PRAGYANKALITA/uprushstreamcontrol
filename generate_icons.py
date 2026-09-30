import zlib
import struct
import math
import os

def create_png(width, height, pixel_func, output_path):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)
        for x in range(width):
            r, g, b, a = pixel_func(x, y, width, height)
            raw_data.extend([int(r), int(g), int(b), int(a)])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def chunk(tag, data):
        c = tag + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    png.extend(chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)))
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(png)
    print(f"Generated {output_path} ({width}x{height})")

def render_icon_pixel(x, y, w, h, is_maskable=False):
    nx = (x / (w - 1)) * 2 - 1
    ny = (y / (h - 1)) * 2 - 1
    
    scale = 0.85 if is_maskable else 0.95
    nx /= scale
    ny /= scale
    
    # Pure pitch black background
    bg_val = int(max(0, 10 + 6 * ny))
    
    corner_r = 0.25
    dx = max(0, abs(nx) - (1.0 - corner_r))
    dy = max(0, abs(ny) - (1.0 - corner_r))
    outside_dist = math.sqrt(dx * dx + dy * dy)
    
    if not is_maskable and (outside_dist > corner_r or abs(nx) > 1.0 or abs(ny) > 1.0):
        edge = outside_dist - corner_r
        if edge > 0.05:
            return 0, 0, 0, 0
        alpha = max(0.0, min(1.0, 1.0 - edge / 0.05))
        return bg_val, bg_val, bg_val, int(alpha * 255)
    
    # White border ring
    if 0.88 < max(abs(nx), abs(ny)) < 0.94 or (0.83 < outside_dist < 0.89):
        return 255, 255, 255, 255

    # Trophy Shape
    in_cup = False
    if -0.4 <= ny <= 0.1:
        cup_width = 0.4 - 0.2 * ((ny + 0.4) / 0.5) ** 1.5
        if abs(nx) <= cup_width:
            in_cup = True
            
    if -0.35 <= ny <= 0.0:
        h_outer = 0.55
        h_inner = 0.42
        if h_inner <= abs(nx) <= h_outer:
            in_cup = True
            
    if 0.1 < ny <= 0.35:
        if abs(nx) <= 0.09:
            in_cup = True
            
    if 0.35 < ny <= 0.55:
        base_w = 0.1 + 0.3 * ((ny - 0.35) / 0.2)
        if abs(nx) <= base_w:
            in_cup = True

    in_star = False
    if -0.25 <= ny <= -0.05 and abs(nx) <= 0.18:
        if abs(nx) + abs(ny + 0.15) <= 0.14:
            in_star = True

    if in_star:
        # Black star on white trophy
        return 0, 0, 0, 255
    elif in_cup:
        # High contrast white/silver trophy
        val = int(240 - 30 * ny)
        return val, val, val, 255

    return bg_val, bg_val, bg_val, 255

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
