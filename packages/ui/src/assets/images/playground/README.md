# Runestone material

`runestone.webp` is a shared stone texture for the 2048 board and tiles. It is
referenced only by the on-demand game stylesheet. Numbers, beveled edges, corner
carvings and the Grail are rendered separately for legibility at small sizes.

Generated with the built-in ImageGen tool, then exported to 256×256 WebP at quality 72.

Generation prompt:

> One square seamless albedo texture of finely grained natural limestone / slate,
> neutral medium light warm-gray monochrome. Even diffuse flat lighting, no cast
> shadows, no directionality, no vignette. Very fine mineral flecks, delicate cloudy
> stone variations, faint hairline veins and tiny worn scratches. Visually quiet
> behind large numbers. Premium lightly weathered tabletop stone, not rubble.
> No borders, bevels, carving, ornament, runes, text, objects or watermark.
> Seamless edges; no large cracks or high-contrast shapes. Readable as stone at 80px.

## Excalibur Jump sprites

The stone ledges, lily, sword, and rune were made with ImageGen and exported as
transparent WebP sprites. The game aligns each platform's painted surface with
its collision plane and loads the sprites on demand.

`excalibur-lake-day.webp` and `excalibur-lake.webp` are the daybreak and
moonlit versions of the same scene. Excalibur Jump selects one with the Avalon theme.
