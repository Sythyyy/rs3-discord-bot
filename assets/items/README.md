# Item images

Place PNG item icons in this directory using the content item key as the filename:

- `driftwood.png`
- `copper_ore.png`
- `river_fish.png`
- `bronze_hatchet.png`

The `/bank` renderer scales each image to fit its slot. When an icon is missing, it displays a
temporary initials marker so the bank remains usable.

`bank-empty.png` supplies the bank header, repeatable storage area, footer, and equipment sidebar.
The equipment panel sets a seven-row minimum height; after that, the renderer adds 40-pixel item
rows based on how many distinct item stacks the player owns. Equipped-item overlays can be added to
the sidebar later without changing the bank layout.
