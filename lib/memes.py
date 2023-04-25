import os
import textwrap
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from memebook.settings import BASE_DIR
from main.models import Meme, DefaultTemplate
from django.core.files import File

def create_meme_image(default_slug, top_text, bottom_text):
    # Load the meme
    meme = Image.open(f"assets/images/default_templates/{default_slug}.jpeg")
    draw = ImageDraw.Draw(meme)
    meme_width, meme_height = meme.size

    # Load a font
    font_size = int(meme_height * 0.1)
    font_path = os.path.join(BASE_DIR, 'assets/fonts/impact.ttf')
    font = ImageFont.truetype(font_path, font_size)

    # Define stroke and fill colors
    stroke_width = 2
    stroke_fill = (0, 0, 0)
    text_fill = (255, 255, 255)

    # Wrap the top text
    max_width = int(meme_width * 0.9) / int(font_size * .5)
    top_lines = textwrap.wrap(top_text, width=max_width)

    # Wrap the bottom text
    bottom_lines = textwrap.wrap(bottom_text, width=max_width)

    # Add the wrapped top text to the meme
    for line_index, line in enumerate(top_lines):
        line_width, line_height = draw.textsize(line, font)
        line_x = (meme_width - line_width) / 2
        line_y = line_index * line_height

        for x_offset, y_offset in ((-stroke_width, 0), (stroke_width, 0), (0, -stroke_width), (0, stroke_width)):
            draw.text((line_x + x_offset, line_y + y_offset), line, font=font, fill=stroke_fill)
        draw.text((line_x, line_y), line, font=font, fill=text_fill)

    # Calculate the gap between the bottom line of the bottom text and the bottom of the photo
    bottom_gap_percentage = 0.05  # Set the percentage as required
    bottom_gap = int(meme_height * bottom_gap_percentage)

    # Add the wrapped bottom text to the meme
    for line_index, line in enumerate(bottom_lines):
        line_width, line_height = draw.textsize(line, font)
        line_x = (meme_width - line_width) / 2
        line_y = meme_height - (len(bottom_lines) - line_index) * line_height - bottom_gap

        for x_offset, y_offset in ((-stroke_width, 0), (stroke_width, 0), (0, -stroke_width), (0, stroke_width)):
            draw.text((line_x + x_offset, line_y + y_offset), line, font=font, fill=stroke_fill)
        draw.text((line_x, line_y), line, font=font, fill=text_fill)

    # Save the output image to an in-memory file
    output_meme = BytesIO()
    meme.save(output_meme, format='JPEG')
    output_meme.seek(0)

    return output_meme


def create_meme(profile, meme_data, save=True):
    top_text = meme_data['top_text']
    bottom_text = meme_data['bottom_text']
    template_slug = meme_data['template_slug']
    meme_image = create_meme_image(template_slug, top_text, bottom_text)

    # Create a new Meme instance
    new_meme = Meme(
        top_text=top_text,
        bottom_text=bottom_text,
        template=DefaultTemplate.objects.filter(
            slug_name=template_slug
        ).first(),
        profile=profile
    )

    # Save the meme image using the save() method of the FileField
    new_meme.image.save(f"{new_meme.uuid}.jpeg", File(meme_image))
    new_meme.save()

    return new_meme

