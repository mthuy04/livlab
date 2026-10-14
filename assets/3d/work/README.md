# Conversion workspace

Nơi file 3D đi qua, không phải nơi nó ở.

```
incoming/     FBX / OBJ / GLTF / GLB nhận từ bên export. KHÔNG commit.
normalized/   master.glb sau chuẩn hoá. KHÔNG commit.
reports/      JSON kết quả mỗi lần convert. CÓ commit — đây là bằng chứng.
screenshots/  ảnh QA. CÓ commit.
```

File chạy thật nằm ở `public/assets/3d/<brand>/<sku>/v<n>/runtime.glb`.

`incoming/` và `normalized/` bị gitignore: file nguồn của hãng là tài sản của
hãng, dung lượng lớn, và có thể tái tạo lại từ bản gốc. Báo cáo thì không —
mất báo cáo là mất lý do vì sao một asset được duyệt.
