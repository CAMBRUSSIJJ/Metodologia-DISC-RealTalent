#!/usr/bin/env python3
"""Instala PDF.js 4.10.38 em vendor/pdfjs no disco local; nunca envia PDFs."""
from __future__ import annotations
import os
from pathlib import Path
import tempfile
import urllib.request

ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/"vendor"/"pdfjs"
VERSION="4.10.38"
BASE=f"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/{VERSION}/"
FILES={"pdf.mjs":"pdf.min.mjs","pdf.worker.mjs":"pdf.worker.min.mjs"}

def ok(path:Path)->bool:
    return path.exists() and path.stat().st_size>50_000

def main():
    DEST.mkdir(parents=True,exist_ok=True)
    marker=DEST/"version.txt"
    if marker.exists() and all(ok(DEST/f) for f in FILES) and marker.read_text().strip()==VERSION:
        print(f"PDF.js {VERSION} local disponível.")
        return 0
    data={}
    for target,source in FILES.items():
        url=BASE+source
        try:
            req=urllib.request.Request(url,headers={"User-Agent":"RealTalent-Preview/11.4"})
            with urllib.request.urlopen(req,timeout=16) as resp:
                if resp.status!=200:
                    raise RuntimeError(f"HTTP {resp.status}")
                body=resp.read(8*1024*1024)
            if len(body)<50_000 or b"pdfjsVersion" not in body and VERSION.encode() not in body:
                raise RuntimeError("Distribuição PDF.js inválida ou incompleta")
            data[target]=body
        except Exception as exc:
            print(f"AVISO: não foi possível instalar PDF.js local: {exc}")
            print("A visualização poderá usar o CDN versionado ou o leitor nativo.")
            return 0
    for name,body in data.items():
        fd,path=tempfile.mkstemp(dir=DEST,prefix=name+".",suffix=".tmp")
        with os.fdopen(fd,"wb") as f:
            f.write(body)
        os.replace(path,DEST/name)
    (DEST/"version.txt").write_text(VERSION+"\\n")
    print(f"PDF.js {VERSION} instalado localmente: {len(data)} módulos, uso sem CDN após instalar.")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
