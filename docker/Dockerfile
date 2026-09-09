# ── Stage 1: ambil sqlite3 binary + libs dari Alpine standar ────────────────
# n8n:latest memakai "Docker Hardened Alpine" yang apk-nya di-strip.
# Kita copy binary sqlite3 beserta shared library-nya dari Alpine reguler.
FROM alpine:3.21 AS sqlite-builder
RUN apk add --no-cache sqlite

# ── Stage 2: image final n8n + sqlite3 ──────────────────────────────────────
FROM n8nio/n8n:latest

# Copy sqlite3 binary dan semua shared libs yang dibutuhkan
COPY --from=sqlite-builder /usr/bin/sqlite3            /usr/local/bin/sqlite3
COPY --from=sqlite-builder /usr/lib/libreadline.so.8   /usr/local/lib/libreadline.so.8
COPY --from=sqlite-builder /usr/lib/libncursesw.so.6   /usr/local/lib/libncursesw.so.6
# musl libc sudah ada di hardened image, tidak perlu di-copy

# Pastikan dynamic linker menemukan libs di /usr/local/lib
# Buat symlink di /usr/lib agar ld-musl mencari di sana juga
USER root
RUN ln -sf /usr/local/lib/libreadline.so.8 /usr/lib/libreadline.so.8 && \
    ln -sf /usr/local/lib/libncursesw.so.6 /usr/lib/libncursesw.so.6 && \
    chmod +x /usr/local/bin/sqlite3
USER node

# Verifikasi sqlite3 berfungsi
RUN sqlite3 --version
