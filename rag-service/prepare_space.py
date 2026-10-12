"""Package only reviewed public sources for browser upload to Hugging Face."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent
out = root.parent / "scratch" / "hf-rag-deploy"
out.mkdir(parents=True, exist_ok=True)
manifest = json.loads((root / "UPSTREAM.json").read_text())
with ZipFile(out / "service.zip", "w", ZIP_DEFLATED) as archive:
    for name in manifest["preserved_files"] + ["UPSTREAM.json", "runtime.py"]:
        archive.write(root / name, name)
(out / "README.md").write_bytes((root / "README.md").read_bytes())
docker = (root / "Dockerfile").read_text()
docker = docker.replace("COPY runtime.py /app/runtime.py\n", "")
docker = docker.replace("COPY public_demo/requirements.txt /app/requirements.txt\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY public_demo /app/public_demo\nCOPY src /app/src", "COPY service.zip /tmp/service.zip\nRUN python -m zipfile -e /tmp/service.zip /app\nRUN pip install --no-cache-dir -r public_demo/requirements.txt")
(out / "Dockerfile").write_text(docker)
print(out)
