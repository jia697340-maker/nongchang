import React, { useState, useRef, useEffect } from 'react';
import { Backpack, Droplets, Sprout, User, Settings, MessageCircle, Coins, Gem, Info, X, Wheat, Axe, Shield, Box, Sparkles, Dog, Map, Fence, Hammer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- MOCK DATA ---
const CATEGORIES = [
  { id: 'seeds', name: '种子', icon: <Sprout size={16} /> },
  { id: 'harvest', name: '收获道具', icon: <Hammer size={16} /> },
  { id: 'magic', name: '魔法', icon: <Sparkles size={16} /> },
];

const ITEMS = {
  water: [
    { id: 'w1', name: '破旧水壶', type: 'water', costG: 0, costD: 0, bonus: '基础浇水，无加成', infinite: true },
    { id: 'w2', name: '铁皮水壶', type: 'water', costG: 10, costD: 0, bonus: '水分保持+10%' },
    { id: 'w3', name: '黄金水壶', type: 'water', costG: 50, costD: 2, bonus: '水分保持+50%，生长加速' },
  ],
  fertilizer: [
    { id: 'f1', name: '普通肥料', type: 'fertilizer', costG: 0, costD: 0, bonus: '基础施肥，无加成', infinite: true },
    { id: 'f2', name: '高级肥料', type: 'fertilizer', costG: 20, costD: 0, bonus: '产量+10%' },
    { id: 'f3', name: '神奇肥料', type: 'fertilizer', costG: 100, costD: 5, bonus: '产量+50%，有几率产出钻石' },
  ],
  seeds: [
    { id: 's1', name: '小麦种子', type: 'seeds', costG: 5, costD: 0, bonus: '成熟快，基础收益', level: 1, yieldG: 15, yieldD: 0, time: 3000 },
    { id: 's2', name: '玫瑰种子', type: 'seeds', costG: 30, costD: 0, bonus: '观赏性强，中等收益', level: 2, yieldG: 80, yieldD: 0, time: 8000 },
    { id: 's3', name: '摇钱树种', type: 'seeds', costG: 150, costD: 5, bonus: '生长极慢，高几率产出钻石', level: 3, yieldG: 400, yieldD: 3, time: 15000 },
  ],
  harvest: [
    { id: 'h1', name: '破旧镰刀', type: 'harvest', costG: 5, costD: 0, bonus: '只能收割1级作物', maxLevel: 1 },
    { id: 'h2', name: '铁质镰刀', type: 'harvest', costG: 40, costD: 0, bonus: '最高收割2级作物', maxLevel: 2 },
    { id: 'h3', name: '黄金镰刀', type: 'harvest', costG: 150, costD: 2, bonus: '可收割所有作物', maxLevel: 3 },
  ],
  magic: [
    { id: 'm1', name: '时光沙漏', type: 'magic', costG: 100, costD: 1, bonus: '一秒催熟作物', effect: 'instant' },
    { id: 'm2', name: '丰收号角', type: 'magic', costG: 300, costD: 5, bonus: '所有作物立即成熟', effect: 'instant_all' },
  ]
};

export default function App() {
  // --- STATE ---
  const [stats, setStats] = useState({ level: 5, exp: 1200, maxExp: 2000, gold: 500, diamond: 20 });
  const [inventory, setInventory] = useState<Record<string, number>>({
    's1': 5,
    'h1': 5,
    'w1': 1,
    'f1': 1
  });
  
  const [activeModal, setActiveModal] = useState<'attributes' | 'water' | 'fertilizer' | 'backpack' | null>(null);
  const [activeCategory, setActiveCategory] = useState('seeds');
  const [selectedTool, setSelectedTool] = useState<any>(null); // The item currently held in hand
  
  // Soil grid: 16 plots
  const [plots, setPlots] = useState(Array(16).fill({ state: 'empty', plantId: null, plantedAt: 0 }));
  
  // Chat & UI
  const [isChatting, setIsChatting] = useState(false);
  const [inputText, setInputText] = useState("");
  const [user1Message, setUser1Message] = useState("");
  const [detailItem, setDetailItem] = useState<any>(null); // For long press
  const [toast, setToast] = useState<string | null>(null);
  const isLongPress = useRef(false);

  // --- LOGIC ---
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    if (stats.gold === 0) {
      showToast("金币耗尽，农场破产啦！");
    }
  }, [stats.gold]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      setUser1Message(inputText);
      setInputText("");
      setIsChatting(false);
      setTimeout(() => setUser1Message(""), 5000);
    }
  };

  const handleBuy = (item: any) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    if (stats.gold >= item.costG && stats.diamond >= item.costD) {
      setStats(s => ({ ...s, gold: s.gold - item.costG, diamond: s.diamond - item.costD }));
      setInventory(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
      showToast(`成功购买 ${item.name}!`);
    } else {
      showToast("金币或钻石不足！");
    }
  };

  const handleEquip = (item: any) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    const qty = inventory[item.id] || 0;
    if (qty > 0 || item.infinite) {
      setSelectedTool(item);
      showToast(`已装备 ${item.name}`);
      setActiveModal(null);
    } else {
      showToast(`${item.name} 数量不足，请先购买！`);
    }
  };

  const handlePlotClick = (index: number) => {
    const plot = plots[index];
    
    if (!selectedTool) {
      showToast("请先在背包或商店装备物品！");
      return;
    }

    const toolQty = inventory[selectedTool.id] || 0;
    if (toolQty <= 0 && !selectedTool.infinite) {
      showToast(`${selectedTool.name} 数量不足，请购买！`);
      setSelectedTool(null);
      return;
    }

    // Plant seed
    if (selectedTool.type === 'seeds') {
      if (plot.state !== 'empty') {
        showToast("土地已经被占用了！");
        return;
      }
      
      if (!selectedTool.infinite) {
        setInventory(prev => ({ ...prev, [selectedTool.id]: prev[selectedTool.id] - 1 }));
      }
      
      const newPlots = [...plots];
      newPlots[index] = { state: 'growing', plantId: selectedTool.id, plantedAt: Date.now() };
      setPlots(newPlots);
      
      // Simulate growth
      setTimeout(() => {
        setPlots(prev => {
          const p = [...prev];
          if (p[index].state === 'growing' && p[index].plantedAt === newPlots[index].plantedAt) {
            p[index] = { ...p[index], state: 'ready' };
          }
          return p;
        });
      }, selectedTool.time || 3000);
      return;
    }

    // Harvest
    if (selectedTool.type === 'harvest') {
      if (plot.state !== 'ready') {
        showToast("作物还没成熟呢！");
        return;
      }
      const seed = ITEMS.seeds.find(s => s.id === plot.plantId);
      if (seed && selectedTool.maxLevel < seed.level) {
        showToast(`工具等级太低，无法收割 ${seed.name} (需要Lv.${seed.level})！`);
        return;
      }

      if (!selectedTool.infinite) {
        setInventory(prev => ({ ...prev, [selectedTool.id]: prev[selectedTool.id] - 1 }));
      }

      if (seed) {
        setStats(s => ({ 
          ...s, 
          gold: s.gold + seed.yieldG, 
          diamond: s.diamond + seed.yieldD,
          exp: s.exp + 10
        }));
        showToast(`收获 ${seed.name}! +${seed.yieldG}金币 ${seed.yieldD > 0 ? `+${seed.yieldD}钻石` : ''}`);
      }
      const newPlots = [...plots];
      newPlots[index] = { state: 'empty', plantId: null, plantedAt: 0 };
      setPlots(newPlots);
      return;
    }

    // Magic
    if (selectedTool.type === 'magic') {
      if (selectedTool.effect === 'instant') {
        if (plot.state !== 'growing') {
          showToast("只能对生长中的作物使用！");
          return;
        }
        if (!selectedTool.infinite) {
          setInventory(prev => ({ ...prev, [selectedTool.id]: prev[selectedTool.id] - 1 }));
        }
        const newPlots = [...plots];
        newPlots[index] = { ...newPlots[index], state: 'ready' };
        setPlots(newPlots);
        showToast("魔法生效！作物瞬间成熟了！");
      } else if (selectedTool.effect === 'instant_all') {
        const hasGrowing = plots.some(p => p.state === 'growing');
        if (!hasGrowing) {
          showToast("没有正在生长的作物！");
          return;
        }
        if (!selectedTool.infinite) {
          setInventory(prev => ({ ...prev, [selectedTool.id]: prev[selectedTool.id] - 1 }));
        }
        setPlots(prev => prev.map(p => p.state === 'growing' ? { ...p, state: 'ready' } : p));
        showToast("大魔法生效！所有作物瞬间成熟了！");
      }
      return;
    }

    // Water / Fertilizer (dummy interaction for now)
    if (selectedTool.type === 'water' || selectedTool.type === 'fertilizer') {
      if (plot.state === 'empty') {
        showToast("这里什么都没有！");
        return;
      }
      if (!selectedTool.infinite) {
        setInventory(prev => ({ ...prev, [selectedTool.id]: prev[selectedTool.id] - 1 }));
      }
      showToast(`使用了 ${selectedTool.name}`);
    }
  };

  // --- LONG PRESS LOGIC ---
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const handlePressStart = (item: any) => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setDetailItem(item);
    }, 500); // 500ms for long press
  };
  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setDetailItem(null);
  };

  return (
    <div className="relative w-full h-screen bg-[#8BC34A] overflow-hidden select-none font-sans flex flex-col">
      {/* Grass Pattern */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#558B2F 2px, transparent 2px)', 
          backgroundSize: '24px 24px' 
        }}
      />

      {/* Top Bar: Couple Profiles & Currency */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-start z-10 pt-safe pointer-events-none">
        {/* User 1 (Left) */}
        <div className="relative flex flex-col items-start gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/20 shadow-sm w-40">
            <div className="w-10 h-10 shrink-0 rounded-full bg-white/40 border-2 border-[#8BC34A] shadow-sm flex items-center justify-center overflow-hidden">
              <img src="https://picsum.photos/seed/user1/100/100" alt="User 1" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col justify-center flex-1">
              <div className="text-white text-xs font-bold drop-shadow-md truncate">Lv.{stats.level} 农场主</div>
              <div className="w-full h-1.5 bg-black/30 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-[#8BC34A]" style={{ width: `${(stats.exp / stats.maxExp) * 100}%` }} />
              </div>
            </div>
          </div>
          <AnimatePresence>
            {user1Message && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.8 }}
                className="ml-2 bg-white/95 backdrop-blur-sm text-[#333] px-3 py-2 rounded-2xl rounded-tl-sm shadow-md text-sm max-w-[150px] sm:max-w-[200px] break-words border border-white/50"
              >
                {user1Message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Currency & User 2 (Right) */}
        <div className="relative flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
             <div className="flex items-center gap-1 text-yellow-300 font-bold text-sm drop-shadow-md">
               <Coins size={14} /> {stats.gold}
               {stats.gold === 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm animate-pulse">破产</span>}
             </div>
             <div className="w-px h-3 bg-white/30 mx-1" />
             <div className="flex items-center gap-1 text-cyan-300 font-bold text-sm drop-shadow-md">
               <Gem size={14} /> {stats.diamond}
             </div>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse bg-black/20 backdrop-blur-md p-1.5 pl-4 rounded-full border border-white/20 shadow-sm w-40 mt-1">
            <div className="w-10 h-10 shrink-0 rounded-full bg-white/30 border-2 border-[#8BC34A] shadow-sm flex items-center justify-center overflow-hidden">
              <img src="https://picsum.photos/seed/user2/100/100" alt="User 2" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col justify-center items-end flex-1">
              <div className="text-white text-xs font-bold drop-shadow-md truncate">Lv.{stats.level} 伴侣</div>
              <div className="w-full h-1.5 bg-black/30 rounded-full mt-1 overflow-hidden flex justify-end">
                <div className="h-full bg-[#8BC34A]" style={{ width: `${(stats.exp / stats.maxExp) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Farm Land (Soil Grid) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[92vw] sm:max-w-md z-0">
        <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-[#5D4037]/30 rounded-2xl backdrop-blur-sm border border-white/10 shadow-xl">
          {plots.map((plot, i) => (
            <div 
              key={i} 
              onClick={() => handlePlotClick(i)}
              className="aspect-square bg-[#8D6E63] rounded-xl border-b-[6px] border-[#5D4037] shadow-inner relative overflow-hidden cursor-pointer hover:brightness-110 active:border-b-2 active:translate-y-1 transition-all flex items-center justify-center"
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3E2723 1.5px, transparent 1.5px)', backgroundSize: '8px 8px' }} />
              
              {/* Plant Visuals */}
              {plot.state === 'growing' && <Sprout className="text-[#8BC34A] animate-pulse" size={32} />}
              {plot.state === 'ready' && <Wheat className="text-yellow-400 drop-shadow-md animate-bounce" size={40} />}
            </div>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-50 backdrop-blur-md"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input Overlay */}
      <AnimatePresence>
        {isChatting && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 sm:bottom-28 left-0 w-full px-4 z-30 flex justify-center"
          >
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-lg w-full max-w-sm border border-black/5">
              <input
                type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入聊天内容..."
                className="flex-1 bg-transparent outline-none px-3 text-sm text-gray-800 placeholder-gray-400"
                autoFocus
              />
              <button onClick={handleSendMessage} className="bg-[#8BC34A] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#7CB342] active:scale-95 transition-all">
                发送
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Dock: Tools & Menu */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 w-full px-4 flex justify-center z-20 pb-safe">
        <div className="flex items-center gap-1 sm:gap-2 bg-black/30 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-lg overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ToolButton icon={<Backpack size={20} />} label="背包" onClick={() => setActiveModal('backpack')} isActive={activeModal === 'backpack'} />
          <ToolButton icon={<Droplets size={20} />} label="水壶" onClick={() => setActiveModal('water')} isActive={activeModal === 'water'} />
          <ToolButton icon={<Sprout size={20} />} label="肥料" onClick={() => setActiveModal('fertilizer')} isActive={activeModal === 'fertilizer'} />
          
          <div className="w-px h-8 bg-white/20 mx-1 shrink-0" />
          
          <ToolButton icon={<MessageCircle size={20} />} label="聊天" onClick={() => setIsChatting(!isChatting)} isActive={isChatting} />
          <ToolButton icon={<User size={20} />} label="属性" onClick={() => setActiveModal('attributes')} isActive={activeModal === 'attributes'} />
          <ToolButton icon={<Settings size={20} />} label="设置" />
        </div>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#F5F5F0] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#795548] text-white p-4 flex justify-between items-center shadow-md z-10">
                <h2 className="text-lg font-bold">
                  {activeModal === 'attributes' && '农场属性'}
                  {activeModal === 'water' && '水壶商店'}
                  {activeModal === 'fertilizer' && '肥料商店'}
                  {activeModal === 'backpack' && '物资背包'}
                </h2>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
              </div>

              {/* Modal Content */}
              <div className="p-4 overflow-y-auto flex-1 relative">
                
                {/* Attributes Modal */}
                {activeModal === 'attributes' && (
                  <div className="space-y-4 text-[#5D4037]">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="font-bold">农场等级</span>
                      <span className="text-lg font-black text-[#8BC34A]">Lv.{stats.level}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="font-bold">当前经验</span>
                      <span>{stats.exp} / {stats.maxExp}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="font-bold">拥有金币</span>
                      <span className="flex items-center gap-1 text-yellow-500 font-bold"><Coins size={16}/> {stats.gold}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="font-bold">拥有钻石</span>
                      <span className="flex items-center gap-1 text-cyan-500 font-bold"><Gem size={16}/> {stats.diamond}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <span className="font-bold block mb-2 border-b pb-2">加成属性</span>
                      <ul className="text-sm space-y-2 text-gray-600">
                        <li>• 基础生长速度: +5%</li>
                        <li>• 伴侣亲密度加成: +10% 产量</li>
                        <li>• 默认水壶加成: 无</li>
                        <li>• 默认肥料加成: 无</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Tool Shops (Water / Fertilizer) */}
                {(activeModal === 'water' || activeModal === 'fertilizer') && (
                  <div className="grid grid-cols-1 gap-3">
                    {ITEMS[activeModal].map(item => (
                      <ShopItem 
                        key={item.id} item={item} quantity={inventory[item.id] || 0}
                        onPressStart={() => handlePressStart(item)} onPressEnd={handlePressEnd}
                        onBuy={() => handleBuy(item)} onEquip={() => handleEquip(item)}
                        isSelected={selectedTool?.id === item.id}
                      />
                    ))}
                  </div>
                )}

                {/* Backpack Modal */}
                {activeModal === 'backpack' && (
                  <div className="flex flex-col h-full">
                    {/* Categories Tabs */}
                    <div className="flex overflow-x-auto gap-2 pb-3 mb-3 border-b border-gray-200 [&::-webkit-scrollbar]:hidden">
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat.id} onClick={() => setActiveCategory(cat.id)}
                          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors", 
                            activeCategory === cat.id ? "bg-[#8BC34A] text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          {cat.icon} {cat.name}
                        </button>
                      ))}
                    </div>
                    {/* Items Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {(ITEMS[activeCategory as keyof typeof ITEMS] || []).map(item => (
                        <ShopItem 
                          key={item.id} item={item} quantity={inventory[item.id] || 0}
                          onPressStart={() => handlePressStart(item)} onPressEnd={handlePressEnd}
                          onBuy={() => handleBuy(item)} onEquip={() => handleEquip(item)}
                          isSelected={selectedTool?.id === item.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Long Press Detail Popup */}
      <AnimatePresence>
        {detailItem && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl z-50 w-64 pointer-events-none"
          >
            <h3 className="font-bold text-lg mb-1 text-[#8BC34A]">{detailItem.name}</h3>
            <p className="text-sm text-gray-300 mb-3">{detailItem.bonus}</p>
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="flex items-center gap-1 text-yellow-400"><Coins size={14}/> {detailItem.costG}</span>
              <span className="flex items-center gap-1 text-cyan-400"><Gem size={14}/> {detailItem.costD}</span>
            </div>
            {detailItem.type === 'seeds' && (
              <div className="mt-2 text-xs text-gray-400 border-t border-white/20 pt-2">
                预计收益: {detailItem.yieldG}金币 {detailItem.yieldD > 0 && `, ${detailItem.yieldD}钻石`}
                <br />
                成熟时间: {detailItem.time / 1000}秒
                <br />
                等级要求: Lv.{detailItem.level}
              </div>
            )}
            {detailItem.type === 'harvest' && (
              <div className="mt-2 text-xs text-gray-400 border-t border-white/20 pt-2">
                最高收割等级: Lv.{detailItem.maxLevel}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function ToolButton({ icon, label, onClick, isActive }: { icon: React.ReactNode, label: string, onClick?: () => void, isActive?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all shrink-0 group",
        isActive ? "bg-white/40 shadow-inner scale-95" : "hover:bg-white/20 active:bg-white/30 active:scale-95"
      )}
    >
      <div className={cn("transition-transform", isActive ? "text-white" : "text-white/90 group-hover:text-white group-hover:-translate-y-0.5")}>
        {icon}
      </div>
      <span className={cn("text-[10px] sm:text-xs font-medium", isActive ? "text-white" : "text-white/80")}>
        {label}
      </span>
    </button>
  );
}

function ShopItem({ item, quantity, onPressStart, onPressEnd, onBuy, onEquip, isSelected }: any) {
  return (
    <div 
      onMouseDown={onPressStart} onMouseUp={onPressEnd} onMouseLeave={onPressEnd}
      onTouchStart={onPressStart} onTouchEnd={onPressEnd} onTouchCancel={onPressEnd}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "bg-white rounded-xl p-3 shadow-sm border-2 transition-all relative flex items-center justify-between gap-3",
        isSelected ? "border-[#8BC34A] bg-[#F1F8E9]" : "border-transparent hover:border-gray-200"
      )}
    >
      <div className="flex items-center justify-center bg-gray-100 rounded-lg w-14 h-14 shrink-0">
        {item.type === 'water' && <Droplets className="text-blue-400" />}
        {item.type === 'fertilizer' && <Sprout className="text-green-500" />}
        {item.type === 'seeds' && <Wheat className="text-yellow-500" />}
        {item.type === 'harvest' && <Hammer className="text-gray-500" />}
        {item.type === 'magic' && <Sparkles className="text-purple-500" />}
      </div>
      
      <div className="flex flex-col flex-1">
        <span className="font-bold text-gray-800 text-sm">{item.name}</span>
        <span className="text-xs text-gray-500 line-clamp-1">{item.bonus}</span>
        
        <div className="flex items-center gap-2 mt-1">
          {item.costG > 0 && <span className="flex items-center text-xs font-bold text-yellow-500"><Coins size={12} className="mr-0.5"/>{item.costG}</span>}
          {item.costD > 0 && <span className="flex items-center text-xs font-bold text-cyan-500"><Gem size={12} className="mr-0.5"/>{item.costD}</span>}
          {item.costG === 0 && item.costD === 0 && <span className="text-xs text-gray-400">免费</span>}
        </div>

        <div className="flex gap-2 mt-2 w-full">
          <button onClick={onBuy} className="flex-1 bg-yellow-400 text-white text-xs font-bold py-1.5 rounded-md active:scale-95 shadow-sm hover:bg-yellow-500">购买</button>
          <button onClick={onEquip} className="flex-1 bg-[#8BC34A] text-white text-xs font-bold py-1.5 rounded-md active:scale-95 shadow-sm hover:bg-[#7CB342]">装备</button>
        </div>
      </div>

      {/* Quantity Badge */}
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm z-10">
        {item.infinite ? '∞' : `x${quantity}`}
      </div>
      
      {isSelected && <div className="absolute top-2 right-2 w-3 h-3 bg-[#8BC34A] rounded-full border-2 border-white shadow-sm" />}
    </div>
  );
}
