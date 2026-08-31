from PIL import Image, ImageDraw, ImageFilter
import os

input_path = '/Users/5sensesimac/.gemini/antigravity/brain/91a1a4a5-7903-4e2b-a39a-68300b2ece18/.user_uploaded/media_1788106087896.jpg'
out_public = '/Users/5sensesimac/Downloads/SUN+WISE_1.1.7_APKPure/zeno/client/public/zeno_inverter.png'
out_assets = '/Users/5sensesimac/Downloads/SUN+WISE_1.1.7_APKPure/zeno/client/src/assets/zeno_inverter.png'
out_server = '/Users/5sensesimac/Downloads/SUN+WISE_1.1.7_APKPure/zeno/server/public/zeno_inverter.png'
out_dist = '/Users/5sensesimac/Downloads/SUN+WISE_1.1.7_APKPure/zeno/client/dist/zeno_inverter.png'

img = Image.open(input_path).convert('RGBA')
width, height = img.size

mask = Image.new('L', (width, height), 0)
draw = ImageDraw.Draw(mask)

# Main chassis rounded rect: (226, 226) to (780, 758), radius = 42
draw.rounded_rectangle([226, 226, 780, 758], radius=42, fill=255)

# Connectors: scan pixel-by-pixel for dark black connector pixels only
pix = img.load()
for y in range(758, 830):
    for x in range(270, 740):
        r, g, b, a = pix[x, y]
        luminance = 0.299 * r + 0.587 * g + 0.114 * b
        if luminance < 140:
            # Clean up bottom floor reflection
            if y > 815 and (x < 390 or x > 430):
                continue
            mask.putpixel((x, y), 255)

# Anti-alias mask
mask = mask.filter(ImageFilter.GaussianBlur(radius=0.5))

img.putalpha(mask)

# Crop
cropped = img.crop([220, 220, 786, 824])

for p in [out_public, out_assets, out_server, out_dist]:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    cropped.save(p, 'PNG')

print('✅ Cleaned Inverter Cutout Generated:', cropped.size)
