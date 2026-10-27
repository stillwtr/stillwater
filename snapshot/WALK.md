# The Walk

This page paints the plate in the browser. It does not mint.

https://stillwtr.github.io/stillwater/art/walk.html

On mainnet the page uses hall `0x189739F6f054feCdeb765E9BfF9ad972a094db94`. On Sepolia the link needs `chain=sepolia` and hall `0x81236B313E25DfCb0D70AdA9A8D5B9f1970399b4`. Older Sepolia addresses are in `snapshot/SEPOLIA.md`.

`tokenURI` is JSON inside a data URL. `image` is walkBase with `?id=` and `&still=1`. `animation_url` is walkBase with `?id=`. walkBase is set in the constructor. Both live halls use `https://stillwtr.github.io/stillwater/art/walk.html`.

The brush holds another copy of the page. `tokenURI` does not call the brush. If this site is gone, read the page from the brush.
