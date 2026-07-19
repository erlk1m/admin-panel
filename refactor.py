import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add activeTab state
if 'const [activeTab, setActiveTab]' not in content:
    content = content.replace(
        'const [adminPassword, setAdminPassword] = useState("");',
        'const [adminPassword, setAdminPassword] = useState("");\n  const [activeTab, setActiveTab] = useState("overview");'
    )

# Extract sections
# Card 0
card0 = re.search(r'\{/\* Card 0: Analytics Dashboard \*/\}(.*?)(?=\{/\* Card 1: Playlist M3U Multi-Server \*/\})', content, re.DOTALL).group(0)

# Card 1
card1 = re.search(r'\{/\* Card 1: Playlist M3U Multi-Server \*/\}(.*?)(?=\{/\* Card 2: Keamanan Akses \(Multi-Token\) \*/\})', content, re.DOTALL).group(0)

# Card 2
card2 = re.search(r'\{/\* Card 2: Keamanan Akses \(Multi-Token\) \*/\}(.*?)(?=\{/\* Card 3: Wallpaper TV \*/\})', content, re.DOTALL).group(0)

# Card 3 (Wallpaper)
card3 = re.search(r'\{/\* Card 3: Wallpaper TV \*/\}(.*?)(?=\{/\* Card: Auto Update \*/\})', content, re.DOTALL).group(0)

# Card Auto Update
cardUpdate = re.search(r'\{/\* Card: Auto Update \*/\}(.*?)(?=\{/\* Card 4: Notifikasi / Marquee \*/\})', content, re.DOTALL).group(0)

# Card 4 (Notifikasi)
card4 = re.search(r'\{/\* Card 4: Notifikasi / Marquee \*/\}(.*?)(?=\{/\* Card: Chat Moderation \*/\})', content, re.DOTALL).group(0)

# Card Chat
cardChat = re.search(r'\{/\* Card: Chat Moderation \*/\}(.*?)(?=\{/\* Card 5: Maintenance Mode \*/\})', content, re.DOTALL).group(0)

# Card 5 (Maintenance)
card5 = re.search(r'\{/\* Card 5: Maintenance Mode \*/\}(.*?)(?=</div>\s*\{/\* Save Button \*/\})', content, re.DOTALL).group(0)

# Remove 'md:col-span-2' from all cards since they will just stack normally in the new layout
def remove_colspan(text):
    return text.replace(' md:col-span-2', '')

card0 = remove_colspan(card0)
card1 = remove_colspan(card1)
card2 = remove_colspan(card2)
card3 = remove_colspan(card3)
cardUpdate = remove_colspan(cardUpdate)
card4 = remove_colspan(card4)
cardChat = remove_colspan(cardChat)
card5 = remove_colspan(card5)

new_return = f'''  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {{/* Sidebar */}}
      <aside className="w-64 bg-[#111] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-4 border-b border-white/5">
          <div className="bg-red-600 p-2 rounded-xl">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">KIMTV<span className="text-red-500">.</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {{[
            {{ id: "overview", label: "Overview", icon: Activity }},
            {{ id: "playlist", label: "Playlist M3U", icon: Globe }},
            {{ id: "tokens", label: "Akses & Token", icon: Key }},
            {{ id: "chat", label: "Live Chat", icon: MessageSquare }},
            {{ id: "settings", label: "Pengaturan", icon: ShieldAlert }}
          ].map(tab => (
            <button
              key={{tab.id}}
              onClick={{() => setActiveTab(tab.id)}}
              className={{`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${{
                activeTab === tab.id 
                  ? "bg-red-600/10 text-red-500 border border-red-500/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }}`}}
            >
              <tab.icon className="w-5 h-5" />
              {{tab.label}}
            </button>
          ))}}
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={{() => setIsAuthenticated(false)}}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {{/* Main Content Area */}}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {{/* Top Header */}}
        <header className="h-20 bg-[#111]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold capitalize">
              {{activeTab === "overview" && "Dashboard Analytics"}}
              {{activeTab === "playlist" && "M3U Playlist Configuration"}}
              {{activeTab === "tokens" && "Access & Token Management"}}
              {{activeTab === "chat" && "Live Chat Moderation"}}
              {{activeTab === "settings" && "Global App Settings"}}
            </h2>
            <p className="text-sm text-gray-500">Kelola pengaturan aplikasi secara real-time</p>
          </div>
          
          <button
            onClick={{handleSave}}
            disabled={{saving}}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-red-900/20"
          >
            {{saving ? <RefreshCcw className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}}
            {{saving ? "Menyimpan..." : "Simpan Perubahan"}}
          </button>
        </header>

        {{/* Scrollable Content */}}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {{activeTab === "overview" && (
              {card0}
            )}}
            {{activeTab === "playlist" && (
              {card1}
            )}}
            {{activeTab === "tokens" && (
              {card2}
            )}}
            {{activeTab === "chat" && (
              {cardChat}
            )}}
            {{activeTab === "settings" && (
              <div className="space-y-8">
                {card4}
                {card3}
                {cardUpdate}
                {card5}
              </div>
            )}}
          </div>
        </div>
      </main>
    </div>
  );
}}'''

original_return = re.search(r'  return \(\n    <div className="min-h-screen bg-\[#0a0a0a\].*', content, re.DOTALL).group(0)

content = content.replace(original_return, new_return)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
