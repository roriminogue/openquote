# Makes the fonts the web version's PDF is written in (public/fonts/pdf): Figtree at the three weights the quote
# uses (400, 500, 600), as plain TrueType files, from the variable font the app already ships (@fontsource-variable),
# Latin and Latin Extended merged into one file per weight, each with a twin whose digits are the tabular ones (the
# app sets prices in tabular figures; jsPDF can't switch OpenType features on). jsPDF can't use a variable or woff2
# font.
#
#   python3 -m venv .venv && .venv/bin/pip install fonttools brotli
#   .venv/bin/python scripts/pdf-fonts.py node_modules/@fontsource-variable/figtree/files public/fonts/pdf
#
# Figtree is under the SIL Open Font License (public/fonts/pdf/OFL.txt).
import os, sys, tempfile
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.merge import Merger, Options
src = sys.argv[1]; out = sys.argv[2]
for w, name in [(400, "Regular"), (500, "Medium"), (600, "SemiBold")]:
    parts = []
    for sub in ["latin", "latin-ext"]:
        f = TTFont(f"{src}/figtree-{sub}-wght-normal.woff2")
        inst = instantiateVariableFont(f, {"wght": w}, updateFontNames=False)
        inst.flavor = None
        p = os.path.join(tempfile.gettempdir(), f"figtree-{sub}-{w}.ttf"); inst.save(p); parts.append(p)
    merged = Merger(options=Options(drop_tables=["DSIG"])).merge(parts)
    merged.flavor = None
    # One family name per weight so PDF viewers show "Figtree" with the right weight.
    for rec in merged["name"].names:
        if rec.nameID in (1, 16): rec.string = "Figtree"
        if rec.nameID in (2, 17): rec.string = name
        if rec.nameID == 4: rec.string = f"Figtree {name}"
        if rec.nameID == 6: rec.string = f"Figtree-{name}"
    merged["OS/2"].usWeightClass = w
    merged.save(f"{out}/Figtree-{name}.ttf")
    t = TTFont(f"{out}/Figtree-{name}.ttf")
    cmap = t.getBestCmap()
    print(name, len(cmap), "glyphs mapped;", all(ord(c) in cmap for c in "m²³×·“”‘’–—…āēūčšż€"), "upm", t["head"].unitsPerEm, "hhea", t["hhea"].ascent, t["hhea"].descent, t["hhea"].lineGap, "typo", t["OS/2"].sTypoAscender, t["OS/2"].sTypoDescender, "useTypo", bool(t["OS/2"].fsSelection & 128), "win", t["OS/2"].usWinAscent, t["OS/2"].usWinDescent)

    # The twin with tabular figures: the digits mapped straight to their tabular glyphs.
    t = TTFont(f"{out}/Figtree-{name}.ttf")
    tnum = {}
    for fr in t["GSUB"].table.FeatureList.FeatureRecord:
        if fr.FeatureTag == "tnum":
            for li in fr.Feature.LookupListIndex:
                for st in t["GSUB"].table.LookupList.Lookup[li].SubTable:
                    tnum.update(getattr(st, "mapping", {}) or {})
    for table in t["cmap"].tables:
        for code, glyph in list(table.cmap.items()):
            if glyph in tnum: table.cmap[code] = tnum[glyph]
    for rec in t["name"].names:
        if rec.nameID == 4: rec.string = f"Figtree {name} Tabular"
        if rec.nameID == 6: rec.string = f"Figtree-{name}-Tnum"
    t.save(f"{out}/Figtree-{name}-Tnum.ttf")
    print(name, "tabular twin:", len(tnum), "digits")
