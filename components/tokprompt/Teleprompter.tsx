// FULL FILE: Teleprompter.tsx
// ✅ Only edits: unifies editMode logic to use global `editing` from context

import { useEffect, useRef, useState } from "react";
import { useTokPrompt } from "../../lib/context/TokPromptContext";
import { saveSingleScriptToFirestore } from "../../utils/firestoreSaves";

export default function Teleprompter(props) {
  const {
    scripts,
    selectedProductId,
    updateScriptAtIndex,
    updateScriptContent,
    editing,
    dispatch,
    setEditing,
    currentStream,
  } = useTokPrompt();

  const currentScript = selectedProductId ? scripts[selectedProductId] || null : null;
  
  console.log("🧪 selectedProductId:", selectedProductId);
  console.log("🧪 currentScript:", currentScript);  

  const scrollRef = useRef(null);
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fontSize, setFontSize] = useState(36);

  const [colorMode, setColorMode] = useState("creative");
  const [fontHue, setFontHue] = useState(165);
  const [fontLightness, setFontLightness] = useState(70);
  const [bgHue, setBgHue] = useState(0);
  const [bgLightness, setBgLightness] = useState(10);
  const [fontColorSimple, setFontColorSimple] = useState("#FFFFFF");
  const [bgColorSimple, setBgColorSimple] = useState("#000000");

  const fontColor = colorMode === "creative"
    ? `hsl(${fontHue}, 100%, ${fontLightness}%)`
    : fontColorSimple;

  const bgColor = colorMode === "creative"
    ? `hsl(${bgHue}, 100%, ${bgLightness}%)`
    : bgColorSimple;

  const [editBuffer, setEditBuffer] = useState("");
  const [draftScript, setDraftScript] = useState("");
  const [lastProductIdWhileEditing, setLastProductIdWhileEditing] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'success' | 'error'

  console.log("✅ currentStream from context:", currentStream);

  async function handleSave() {
    console.log("🚀 Save clicked");
    console.log("📦 selectedProductId:", selectedProductId);
    console.log("📝 editBuffer:", editBuffer);
    console.log("↪️ Calling updateScriptContent...");
    updateScriptContent(selectedProductId, editBuffer);
  
    if (!currentScript) {
      console.warn("⚠️ No currentScript found");
      return;
    }
  
    if (!currentStream?.id) {
      console.warn("⚠️ No currentStream ID found");
      return;
    }
  
    if (!selectedProductId) {
      console.warn("⚠️ No selectedProductId to update");
      return;
    }
    
    console.log("📌 Product ID:", selectedProductId);
    console.log("📄 editBuffer:", editBuffer);
    
    // ✅ Update locally
    updateScriptContent(selectedProductId, editBuffer);      
  
    // ✅ Exit edit mode
    setEditing(false);
  
    // ✅ Save to Firestore
    try {
      setSaveStatus("saving");
      await saveSingleScriptToFirestore(currentStream.id, {
        ...currentScript,
        content: editBuffer,
        promptsUsed: currentScript.promptsUsed || [],
      }, scripts);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 2000);
      console.log("✅ Mini-save: script saved to Firestore.");
    } catch (err) {
      setSaveStatus("error");
      console.error("❌ Firestore save failed:", err);
    }
  }  
  
  function handleReset() {
    setDraftScript(currentScript.content);
  }

  useEffect(() => {
    if (!editing && currentScript?.content) {
      setEditBuffer(currentScript.content);
    }
  }, [currentScript, editing]);

  useEffect(() => {
    if (editing && currentScript?.productId !== lastProductIdWhileEditing) {
      setEditBuffer(currentScript?.content || "");
      setLastProductIdWhileEditing(currentScript?.productId);
    }
  }, [currentScript, editing]);

  useEffect(() => {
    let scrollInterval;
    if (scrolling && scrollRef.current) {
      scrollInterval = setInterval(() => {
        scrollRef.current.scrollBy({ top: speed, behavior: "smooth" });
      }, 30);
    }
    return () => clearInterval(scrollInterval);
  }, [scrolling, speed]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentScript]);

  const handleRestart = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleEditToggle = () => {
    if (!editing && currentScript?.content) {
      setEditBuffer(currentScript.content);
      setLastProductIdWhileEditing(currentScript.productId);
    }
    setEditing(!editing);
  };

  return (
    <div className="relative w-full rounded-xl border border-[#00FFE0]/30 bg-black shadow-lg overflow-hidden flex flex-col">
      <div className="relative w-full h-full flex">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-8 py-6 leading-relaxed space-y-6"
          style={{
            fontSize: fontSize + 'px',
            height: "600px",
            color: fontColor,
            backgroundColor: bgColor,
            transition: "font-size 0.15s ease-out"
          }}
        >
        {currentScript?.title && (
  <p className="text-sm opacity-60 text-[#00FFE0]">
    Now viewing script for: <strong>{currentScript.title}</strong>
  </p>
)}

          {editing ? (
            <textarea
              value={editBuffer}
              onChange={(e) => setEditBuffer(e.target.value)}
              className="w-full h-96 bg-[#0B0F19] border border-[#00FFE0]/30 text-[#00FFE0] p-4 rounded resize-none text-base"
            />
          ) : currentScript?.content ? (
            currentScript.content.split("\n").map((line, idx) => (
              <p key={idx} className="mb-4">{line}</p>
            ))
          ) : (
            <p className="text-xl text-[#888]">No script selected.</p>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-[#10141c] border-t border-[#00FFE0]/30 text-xs text-[#00FFE0]/70 px-6 flex items-end justify-between">
  {/* Left: Buttons — Switch based on edit mode */}
  {editing ? (
    <div className="flex flex-col gap-2 pb-4">
      <button
        className="w-24 px-4 py-2 bg-[#00FFE0]/10 border border-[#00FFE0]/30 rounded text-[#00FFE0] hover:bg-[#00FFE0]/20 text-sm"
        onClick={handleSave}
      >
        Save
      </button>
      <button
        className="w-24 px-4 py-2 bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded text-[#FF6B6B] hover:bg-[#FF6B6B]/20 text-sm"
        onClick={handleReset}
      >
        Reset
      </button>
      <button
        className="w-24 px-4 py-2 bg-[#111]/20 border border-white/20 rounded text-white hover:bg-white/10 text-sm"
        onClick={() => setEditing(false)}
      >
        Exit
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-3 items-start pb-4">
      <button onClick={() => setScrolling(!scrolling)} className="w-24 px-4 py-2 bg-[#00FFE0]/10 border border-[#00FFE0]/30 rounded text-[#00FFE0] hover:bg-[#00FFE0]/20 text-sm">
        {scrolling ? "Pause" : "Start"}
      </button>
      <button onClick={handleRestart} className="w-24 px-4 py-2 bg-[#00FFE0]/10 border border-[#00FFE0]/30 rounded text-[#00FFE0] hover:bg-[#00FFE0]/20 text-sm">
        Restart
      </button>
      <button onClick={handleEditToggle} className="w-24 px-4 py-2 bg-[#00FFE0]/10 border border-[#00FFE0]/30 rounded text-[#00FFE0] hover:bg-[#00FFE0]/20 text-sm">
        Edit
      </button>
    </div>
  )}

  {/* Right: Font + Color Controls — hidden when editing */}
  {!editing && (
    <div className="flex flex-col items-center justify-end h-full py-4 w-full">
      <div className="flex justify-center gap-6 items-end">
        {[{ label: "Font", value: fontSize, setter: setFontSize, min: 24, max: 60 },
          { label: "Speed", value: speed, setter: setSpeed, min: 0.5, max: 3 }].map(({ label, value, setter, min, max }) => (
          <div key={label} className="flex flex-col items-center">
            <label className="mb-1 text-[10px]">{label}</label>
            <input
              type="range"
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              min={min}
              max={max}
              step="1"
              className="h-28 w-2 accent-[#00FFE0] bg-[#111827] rounded"
              style={{ writingMode: "bt-lr", WebkitAppearance: "slider-vertical" }}
            />
          </div>
        ))}

        <div className="flex flex-col items-center justify-end">
          <div className="flex gap-6 items-end">
            {[{ label: "Colour", value: fontHue, setter: setFontHue },
              { label: "BG", value: bgHue, setter: setBgHue },
              { label: "Font L", value: fontLightness, setter: setFontLightness },
              { label: "BG L", value: bgLightness, setter: setBgLightness }
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex flex-col items-center">
                <label className="mb-1 text-[10px]">{label}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={value}
                  onChange={(e) => colorMode === 'creative' && setter(Number(e.target.value))}
                  disabled={colorMode !== 'creative'}
                  className="h-20 w-2 accent-[#00FFE0] bg-[#111827] rounded"
                  style={{ writingMode: "bt-lr", WebkitAppearance: "slider-vertical", opacity: colorMode === 'creative' ? 1 : 0.3 }}
                />
              </div>
            ))}

            {[{ label: "Font", value: fontColorSimple, setter: setFontColorSimple },
              { label: "BG", value: bgColorSimple, setter: setBgColorSimple }
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex flex-col items-center">
                <label className="mb-1 text-[10px]">{label}</label>
                <input
                  type="color"
                  value={value}
                  onChange={(e) => colorMode === 'simple' && setter(e.target.value)}
                  disabled={colorMode !== 'simple'}
                  className="h-10 w-10 rounded border border-[#00FFE0]/30"
                  style={{ opacity: colorMode === 'simple' ? 1 : 0.3 }}
                />
              </div>
            ))}
          </div>

          <div className="mt-2">
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-2 text-[11px] text-[#00FFE0]">Switch Mode</span>
              <div className="relative">
                <input type="checkbox" checked={colorMode === "simple"} onChange={() => setColorMode(colorMode === "creative" ? "simple" : "creative")} className="sr-only" />
                <div className="w-11 h-6 bg-[#1e293b] rounded-full shadow-inner"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-[#00FFE0] rounded-full shadow transform transition-transform duration-200 ease-in-out"
                     style={{ transform: colorMode === "simple" ? "translateX(20px)" : "translateX(0)" }} />
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )}
</div>

    </div>
  );
}