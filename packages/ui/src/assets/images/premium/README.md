# Premium: Mind games

## Release switch

Premium cosmetics default to enabled only in development and disabled in production (and unspecified/test environments), controlled by `packages/types/user/premium-cosmetics.ts`.
After verifying donation checkout, set `PREMIUM_COSMETICS_ENABLED` to `true`, rebuild the UI and restart/redeploy the backend together.
The same switch controls the avatar catalog, sticker catalog, existing premium avatar display and home page support banner. The Support page always remains complete, including the actual premium avatar artwork.
Artwork, translations and saved selections are retained. Both disabled and enabled behavior have backend tests.

Generated with the built-in image_gen tool. Avatars optimized to 512px PNG; stickers to 320px PNG, preserving generated transparency.

## puppeteer

Reference: ../roles/mordred.webp

Use case: stylized-concept. Create ONE square premium avatar portrait for Avalon. Reference is Mordred, use his handsome dark-haired identity and dark fantasy realism. New exclusive Puppeteer persona, elegant black and antique gold half mask over eyes, sly confident smirk visible, black feathered armor with ornate gold detailing, one raised gloved hand at lower foreground with fine luminous gold puppet strings running from fingers. Tight head and shoulders portrait, face dominates and reads at 48px. Smoky black background, gold rim lighting. Rich cinematic painterly realism, polished collectible game portrait. No text, no border, no watermark.

## eclipse-queen

Reference: ../roles/morgana.webp

Use case: stylized-concept. Create ONE square premium avatar portrait for Avalon. Reference is Morgana, preserve her face and dark hair. Exclusive Queen of the Eclipse persona: elaborate blackened gold crown with amethyst gems, majestic cold confident expression, rich black and violet robe. Dark eclipsed sun with slender luminous gold corona behind head, subtle violet haze. Tight head and shoulders centered portrait, face dominates and reads at 48px. Rich cinematic painterly realism, polished collectible game portrait. No text, no frame, no watermark.

## mordred-puppet

Reference: ../roles/mordred.webp

Use case: stylized-concept. Create ONE transparent game reaction sticker for Avalon. Reference is Mordred: dark swept hair, handsome face, black feathered armor. A very smug knowing grin, one raised gloved hand manipulating clearly visible gold strings connected to a small comical silver knight marionette hanging at lower right; other hand casually pointing at the puppet. Message conveyed: you fell for my plan. Exaggerated readable expression and puppet gesture, waist-up, painterly dark medieval fantasy matching premium game stickers, warm ivory die-cut outline around entire silhouette. Square composition, generous transparent padding, whole hands and puppet inside frame. GENUINE TRANSPARENT ALPHA background, no checkerboard or scenery, no text or watermark.

## morgana-violin

Artwork: `../stickers/morgana-violin.png`. The file and sticker ID are both `morgana-violin`. Generated with the built-in image_gen tool and resized to 320px with alpha preserved.

Latest prompt (references: Morgana role portrait and previous violin sticker):

Use case: stylized-concept. Edit the second reference sticker: replace the male Oberon character with MORGANA from the first reference portrait. Preserve the sticker's concept: sarcastic fake sympathy, exaggerated pitying pout, one eyebrow raised with amused condescending eyes, playing a comically tiny violin and tiny bow near chest. Morgana is a recognizable beautiful adult woman with long black hair, gold crown, black hooded robes, delicate gold jewelry, pale blue eyes from portrait. Feminine face and hands. Keep the same painterly dark medieval fantasy rendering, warm ivory die-cut outline, waist-up square composition, complete hands and silhouette within padding. The violin must read clearly at 96px. GENUINE transparent alpha background, no scenery, no checkerboard, no text, no watermark. This is the premium 'So very sorry…' game reaction sticker.

Original generation:

Reference: ../stickers/oberon-laugh.png

Use case: stylized-concept. Create ONE new transparent Avalon reaction sticker. Reference is Oberon sticker, preserve recognizable hooded dark-haired young man, black cloak and red accents, ivory die-cut outline and painterly rendering. Sarcastic fake sympathy: exaggerated pitying pout, one eyebrow raised and amused eyes, playing an absurdly tiny violin with a tiny bow near his chest, hands very clearly visible and violin readable. Message conveyed: oh, so sad, let me play the world's smallest violin for your excuses. Upper body square composition, full silhouette including hands inside padding. Dark medieval fantasy premium game sticker, readable at 96 pixels. GENUINE TRANSPARENT ALPHA background, no checkerboard, no scenery, no words, no watermark.
