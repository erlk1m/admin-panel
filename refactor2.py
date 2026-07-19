import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def wrap_fragment(text):
    return "<>\n" + text + "\n</>"

content = content.replace(
    '{activeTab === "overview" && (\n              {/* Card 0: Analytics Dashboard */}',
    '{activeTab === "overview" && (\n              <>\n              {/* Card 0: Analytics Dashboard */}',
)

content = content.replace(
    '          </div>\n            )}\n            {activeTab === "playlist" && (\n              {/* Card 1: Playlist M3U Multi-Server */}',
    '          </div>\n              </>\n            )}\n            {activeTab === "playlist" && (\n              <>\n              {/* Card 1: Playlist M3U Multi-Server */}',
)

content = content.replace(
    '            <p className="text-xs text-gray-500 mt-2">Jika Server Utama gagal dimuat, aplikasi akan otomatis mencoba Server Cadangan tanpa sepengetahuan pengguna.</p>\n          </div>\n            )}\n            {activeTab === "tokens" && (\n              {/* Card 2: Keamanan Akses (Multi-Token) */}',
    '            <p className="text-xs text-gray-500 mt-2">Jika Server Utama gagal dimuat, aplikasi akan otomatis mencoba Server Cadangan tanpa sepengetahuan pengguna.</p>\n          </div>\n              </>\n            )}\n            {activeTab === "tokens" && (\n              <>\n              {/* Card 2: Keamanan Akses (Multi-Token) */}',
)

content = content.replace(
    '            <p className="text-xs text-gray-500 mt-2">Hapus token untuk mengeluarkan pengguna (logout) dari TV mereka. Gunakan <b>Reset TV</b> jika pengguna membeli TV baru.</p>\n            </div>\n          </div>\n            )}\n            {activeTab === "chat" && (\n              {/* Card: Chat Moderation */}',
    '            <p className="text-xs text-gray-500 mt-2">Hapus token untuk mengeluarkan pengguna (logout) dari TV mereka. Gunakan <b>Reset TV</b> jika pengguna membeli TV baru.</p>\n            </div>\n          </div>\n              </>\n            )}\n            {activeTab === "chat" && (\n              <>\n              {/* Card: Chat Moderation */}',
)

content = content.replace(
    '              </div>\n            </div>\n          </div>\n            )}\n            {activeTab === "settings" && (\n              <div className="space-y-8">\n                {/* Card 4: Notifikasi / Marquee */}',
    '              </div>\n            </div>\n          </div>\n              </>\n            )}\n            {activeTab === "settings" && (\n              <div className="space-y-8">\n                {/* Card 4: Notifikasi / Marquee */}',
)

# And for settings, since it's wrapped in <div className="space-y-8"> it doesn't need <>.

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Success")
