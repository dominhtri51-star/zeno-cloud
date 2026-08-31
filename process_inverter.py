from PIL import Image, ImageDraw, ImageFilter
import os

input_path = '/Users/5sensesimac/.gemini/antigravity/brain/91a1a4a5-7903-4e2b-a39a-68300b2ece18/.user_uploaded/media_1788103118217.jpg'
out_public = '/Users/5sensesimac/Downloads/SUN+WISE_1.1.7_APKPure/zeno/client/public/zeno_inverter.png'
out_assets = '/Users/5sensesimac/Downloads/SUN+WISE_1.1.7_APKPure/zeno/client/src/assets/zeno_inverter.png'
out_server = '/Users/5sensesimac/Downloads/SUN+WISE_1.1.7_APKPure/zeno/server/public/zeno_inverter.png'

img = Image.open(input_path).convert('RGBA')
width, height = img.size

# Extract mask based on color threshold of background + chassis
# The background in the original photo has R>225, G>225, B>225 (almost white).
# The bottom connectors are black (R<60, G<60, B<60).
# The chassis is white (R>220, G>220, B>220) with borders.

mask = Image.new('L', (width, height), 0)
draw = ImageDraw.Draw(mask)

# Main chassis rounded rect: (212, 212) to (748, 712)
draw.rounded_rectangle([212, 212, 748, 712], radius=38, fill=255)

# Bottom connectors area - get exact pixels of the black connectors
pix = img.load()
for y in range(712, 785):
    for x in range(260, 710):
        r, g, b, a = pix[x, y]
        # If it's a dark pixel belonging to the black connectors
        if (r + g + b) / 3 < 160:
            mask.putpixel((x, y), 255)

# Anti-alias mask slightly
mask = mask.filter(ImageFilter.GaussianBlur(radius=0.5))

img.putalpha(mask)

# Crop
cropped = img.crop([206, 206, 754, 786])

for p in [out_public, out_assets, out_server]:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    cropped.save(p, 'PNG')

print('Refined inverter image size:', cropped.size)
