"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { toPng, toSvg } from "html-to-image";

const schedule = [
  { date: "02", day: "수", channel: "끼용이홀덤TV" },
  { date: "04", day: "금", channel: "헝구리TV" },
  { date: "09", day: "수", channel: "못참지홀덤TV" },
  { date: "11", day: "금", channel: "하리미홀덤" },
  { date: "16", day: "수", channel: "포커하는 도도" },
  { date: "18", day: "금", channel: "쩡이홀덤" },
  { date: "23", day: "수", channel: "소라TV" },
  { date: "25", day: "금", channel: "끼용이홀덤TV" },
  { date: "30", day: "수", channel: "하리미홀덤" },
];

type Row = {
  id: string;
  date: string;
  day: string;
  time: string;
  channel: string;
  buyin: string;
  event: string;
  bonus: string;
};
type Draft = {
  palette?: string;
  month: string;
  headers: string[];
  rows: Row[];
  title: string;
  subtitle: string;
  footer: string;
};
const palettes = [
  { id: "acid", name: "애시드 미니멀", bg: "#171914", fg: "#f3f0e8", accent: "#c8f135", onAccent: "#171914", muted: "#c2c5b9", line: "#51564a", alternate: "#20241c" },
  { id: "ivory", name: "아이보리 에디토리얼", bg: "#f2eee3", fg: "#171712", accent: "#b93624", onAccent: "#fff8ec", muted: "#68645c", line: "#c2bdb1", alternate: "#e9e4d8" },
  { id: "burgundy", name: "버건디 나이트", bg: "#35151e", fg: "#fff4e8", accent: "#ffb39d", onAccent: "#35151e", muted: "#e1bdb4", line: "#84515e", alternate: "#451d28" },
  { id: "cobalt", name: "코발트 블록", bg: "#1739b8", fg: "#fff4db", accent: "#ffb52e", onAccent: "#251600", muted: "#d2dcff", line: "#7184d0", alternate: "#2445c2" },
];
const paletteClasses = [
  "bg-[var(--tone-bg)]! text-[var(--tone-fg)]!",
  "[&_.header-label]:text-[var(--tone-fg)]! [&_.hero_h1]:text-[var(--tone-fg)]!",
  "[&_.time-cell]:text-[var(--tone-fg)]! [&_.entry-cell]:text-[var(--tone-fg)]!",
  "[&_.hero-subtitle_p]:text-[var(--tone-fg)]!",
  "[&_.hero_h1_span]:text-[var(--tone-muted)]! [&_.branch]:text-[var(--tone-muted)]!",
  "[&_.event-cell_span]:text-[var(--tone-muted)]! [&_.footer-note]:text-[var(--tone-muted)]!",
  "[&_.month]:bg-[var(--tone-fg)]! [&_.month]:text-[var(--tone-bg)]!",
  "[&_.table-head]:bg-[var(--tone-fg)]! [&_.table-head]:text-[var(--tone-bg)]!",
  "[&_.table-row:nth-child(even)]:bg-[var(--tone-alt)]!",
  "[&_.date-cell]:bg-[var(--accent)]! [&_.date-cell]:text-[var(--tone-on-accent)]!",
  "[&_.eyebrow]:text-[var(--tone-on-accent)]! [&_.brand-watermark]:bg-[var(--tone-muted)]!",
  "[&_.schedule]:border-[var(--tone-fg)]!",
].join(" ");
// 셀 글자 크기의 기준 행 수. 이보다 행이 많으면 행 높이가 줄어든 비율만큼 글자도 줄인다.
const BASE_ROWS = 9;
// 포스터는 항상 실제 출력 크기로 그리고, 미리보기 칸에 맞춰 통째로 축소해 보여준다.
const POSTER_WIDTH = 760;
const POSTER_HEIGHT = 760 * 594 / 420;
const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const initialDraft = (): Draft => ({
  palette: "ivory",
  month: "2026-12",
  headers: ["DATE", "TIME", "YOUTUBE CHANNEL", "BUY-IN", "EVENT"],
  rows: schedule.map((item, index) => ({
    ...item, id: `initial-${index}`, time: "19:00", buyin: "6,000K",
    event: "1Lv 얼리칩", bonus: "+10,000",
  })),
  title: "유튜버 초청",
  subtitle: "좋아하는 크리에이터와 함께하는 특별한 홀덤 나이트",
  footer: "매주 수·금요일",
});
const storageKey = "kmgm-monthly-posters-v1";
const inputClass = "min-h-11 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus-visible:ring-2 focus-visible:ring-orange-600";
const buttonClass = "min-h-11 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-800 hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-orange-600 disabled:cursor-not-allowed disabled:bg-stone-200";

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (value: string) => void; type?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-stone-700">
      {label}
      <input className={inputClass} type={type} aria-label={label} value={value}
        onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 48 34" aria-hidden="true">
      <rect width="48" height="34" rx="9" fill="currentColor" />
      <path d="m20 10 13 7-13 7V10Z" fill="white" />
    </svg>
  );
}

export default function PosterStudio() {
  const concept = "ivory";
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return saved.active && saved.drafts?.[saved.active] ? saved.drafts[saved.active] : initialDraft();
    } catch { return initialDraft(); }
  });
  const [saveStatus, setSaveStatus] = useState("브라우저 자동 저장");
  const palette = palettes.find((item) => item.id === draft.palette) || palettes[1];
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const monthNumber = Number(draft.month.slice(5, 7)) || 12;
  const updateDraft = (patch: Partial<Draft>) => setDraft((previous) => ({ ...previous, ...patch }));
  const updateRow = (id: string, key: keyof Row, value: string) => {
    setDraft((previous) => ({
      ...previous,
      rows: previous.rows.map((row) => row.id === id ? { ...row, [key]: value } : row),
    }));
  };
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      localStorage.setItem(storageKey, JSON.stringify({
        active: draft.month, drafts: { ...saved.drafts, [draft.month]: draft },
      }));
      setSaveStatus("이 브라우저에 저장됨");
    } catch { setSaveStatus("자동 저장 불가 · JSON 백업을 이용하세요"); }
  }, [draft]);

  const changeMonth = (month: string) => {
    if (!month) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (saved.drafts?.[month]) {
        setDraft(saved.drafts[month]);
        setMessage(`${month} 저장된 초안을 불러왔습니다.`);
        return;
      }
    } catch { /* Continue editing in memory. */ }
    updateDraft({ month });
    setMessage("기존 내용을 복사한 새 월 초안입니다. 날짜와 요일을 확인하세요.");
  };

  const backup = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `KMGM-${draft.month}-편집백업.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const keys = ["date", "day", "time", "channel", "buyin", "event", "bonus"];
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.month) ||
          !Array.isArray(data.headers) || data.headers.length !== 5 ||
          !data.headers.every((value: unknown) => typeof value === "string") ||
          !Array.isArray(data.rows) || data.rows.length < 1 || data.rows.length > 12 ||
          !data.rows.every((row: Record<string, unknown>) => row && keys.every((key) => typeof row[key] === "string")) ||
          !["title", "subtitle", "footer"].every((key) => typeof data[key] === "string")) {
        throw new Error("invalid");
      }
      setDraft({ ...data, rows: data.rows.map((row: Row) => ({ ...row, id: crypto.randomUUID() })) });
      setMessage("백업을 불러왔습니다.");
    } catch { setMessage("올바른 KMGM 편집 백업 JSON 파일을 선택하세요."); }
  };
  const [exporting, setExporting] = useState<"png" | "svg" | null>(null);
  const posterRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sideBySide = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      const byWidth = stage.clientWidth / POSTER_WIDTH;
      const byHeight = sideBySide.matches ? stage.clientHeight / POSTER_HEIGHT : Infinity;
      setPreviewScale(Math.min(1, byWidth, byHeight));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    sideBySide.addEventListener("change", update);
    return () => {
      observer.disconnect();
      sideBySide.removeEventListener("change", update);
    };
  }, []);

  const download = (dataUrl: string, extension: string) => {
    const link = document.createElement("a");
    link.download = `KMGM-${draft.month}-${palette.id}-유튜버초청-A2.${extension}`;
    link.href = dataUrl;
    link.click();
  };

  const exportPoster = async (format: "png" | "svg") => {
    if (!posterRef.current || exporting) return;

    setExporting(format);
    try {
      await document.fonts.ready;
      const commonOptions = {
        cacheBust: true,
        backgroundColor: getComputedStyle(posterRef.current).backgroundColor,
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        style: { width: `${POSTER_WIDTH}px`, height: `${POSTER_HEIGHT}px`, minHeight: "0", maxWidth: "none" },
      };

      if (format === "png") {
        const dataUrl = await toPng(posterRef.current, {
          ...commonOptions,
          canvasWidth: 4961,
          canvasHeight: 7016,
          pixelRatio: 1,
        });
        download(dataUrl, "png");
      } else {
        const dataUrl = await toSvg(posterRef.current, {
          ...commonOptions,
        });
        download(dataUrl, "svg");
      }
      setMessage(`${format.toUpperCase()} 파일을 생성했습니다.`);
    } catch {
      setMessage("파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <main className="poster-shell overflow-x-hidden">
      <section className="w-full max-w-[1100px] rounded-2xl bg-[#f7f5ef] p-5 text-stone-900 shadow-xl md:p-8 print:hidden" aria-label="월간 포스터 편집기">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-stone-300 pb-6">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-orange-800">KMGM POSTER STUDIO</p>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">월간 초청 포스터 편집기</h1>
            <p className="mt-2 text-sm text-stone-600">확정된 레이아웃 그대로 · 색상과 내용을 바꾸면 오른쪽 포스터에 바로 반영됩니다.</p>
          </div>
          <span className="rounded-full border border-stone-300 px-3 py-2 text-sm text-stone-700" role="status">{saveStatus}</span>
        </div>
        <fieldset className="mb-7">
          <legend className="mb-3 text-base font-extrabold">디자인 색상 선택</legend>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {palettes.map((item) => (
              <button type="button" key={item.id}
                disabled={exporting !== null}
                aria-pressed={palette.id === item.id}
                onClick={() => updateDraft({ palette: item.id })}
                className={`min-h-20 rounded-xl border-2 p-3 text-left text-sm font-bold focus-visible:ring-2 focus-visible:ring-orange-700 ${palette.id === item.id ? "border-stone-900 bg-stone-100" : "border-stone-300 bg-white hover:border-stone-500"}`}
              >
                <span className="mb-2 flex gap-1.5" aria-hidden="true">
                  {[item.bg, item.fg, item.accent].map((color) => (
                    <span key={color} className="h-5 w-5 rounded-full border border-black/20" style={{ backgroundColor: color }} />
                  ))}
                </span>
                {item.name}{palette.id === item.id ? " · 선택됨" : ""}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-stone-600">표 크기·글자 크기·헤더 높이·정렬은 동일하며, 색상만 변경됩니다.</p>
        </fieldset>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <Field label="포스터 연월" type="month" value={draft.month} onChange={changeMonth} />
          <Field label="메인 타이틀" value={draft.title} onChange={(title) => updateDraft({ title })} />
          <Field label="하단 강조 문구" value={draft.footer} onChange={(footer) => updateDraft({ footer })} />
          <Field label="타이틀 설명" value={draft.subtitle} onChange={(subtitle) => updateDraft({ subtitle })} />
        </div>
        <div className="mt-7">
          <h2 className="mb-3 text-base font-extrabold">01 · 표 헤더</h2>
          <div className="grid gap-3 md:grid-cols-5">
            {draft.headers.map((header, index) => (
              <Field key={index} label={`${index + 1}열 제목`} value={header} onChange={(value) => {
                updateDraft({ headers: draft.headers.map((text, position) => position === index ? value : text) });
              }} />
            ))}
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold">02 · 일정 내용 <span className="ml-2 text-sm font-medium text-stone-600">{draft.rows.length}개</span></h2>
          <button className={buttonClass} disabled={draft.rows.length >= 12} onClick={() => {
            updateDraft({ rows: [...draft.rows, {
              id: crypto.randomUUID(), date: "", day: "", time: "19:00", channel: "",
              buyin: "6,000K", event: "1Lv 얼리칩", bonus: "+10,000",
            }] });
          }}>+ 일정 추가</button>
        </div>
        <p className="mb-3 mt-2 text-sm text-stone-600">1~12개 행 지원 · 긴 문구는 줄바꿈될 수 있으니 미리보기를 확인하세요.</p>
        <div className="overflow-x-auto rounded-lg border border-stone-300">
          <table className="w-full min-w-[640px] table-fixed text-sm">
            <thead className="bg-stone-200 text-left text-stone-700">
              <tr>{["날짜", "요일", "시간", "유튜브 채널명", "바이인", "이벤트 첫 줄", "이벤트 강조", "관리"].map((label, index) => (
                <th key={label} className={`p-2 font-bold ${index === 3 ? "w-[22%]" : index < 2 ? "w-[8%]" : ""}`}>{label}</th>
              ))}</tr>
            </thead>
            <tbody>
              {draft.rows.map((row, index) => (
                <tr key={row.id} className="border-t border-stone-300 bg-white">
                  {(["date", "day", "time", "channel", "buyin", "event", "bonus"] as const).map((key) => (
                    <td className="p-1.5" key={key}>
                      <input className={inputClass} aria-label={`${index + 1}행 ${key}`}
                        value={row[key]} onChange={(event) => updateRow(row.id, key, event.target.value)} />
                    </td>
                  ))}
                  <td className="p-1.5">
                    <button className="min-h-11 w-full rounded-lg text-sm font-bold text-red-800 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-700 disabled:text-stone-600"
                      aria-label={`${index + 1}행 삭제`} disabled={draft.rows.length === 1}
                      onClick={() => updateDraft({ rows: draft.rows.filter((item) => item.id !== row.id) })}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className={buttonClass} onClick={backup}>편집 내용 백업 (JSON)</button>
          <button className={buttonClass} onClick={() => fileRef.current?.click()}>백업 불러오기</button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" aria-label="백업 파일"
            onChange={(event) => { void importBackup(event.target.files?.[0]); event.target.value = ""; }} />
          <span className="text-sm text-stone-600">다른 기기에서는 JSON 백업을 불러오세요. 서버에는 저장되지 않습니다.</span>
        </div>
        <p role="status" className="mt-3 min-h-5 text-sm font-medium text-orange-900">{message}</p>
      </section>

      <aside className="preview-pane" aria-label="포스터 미리보기">
      <section className="export-bar" aria-label="인쇄용 포스터 다운로드">
        <div className="export-spec">
          <strong>A2 PRINT READY</strong>
          <span>420 × 594mm · PNG 4,961 × 7,016px · 300dpi · RGB</span>
        </div>
        <div className="export-buttons">
          <button type="button" onClick={() => exportPoster("svg")} disabled={exporting !== null}>
            <span>SVG</span>
            {exporting === "svg" ? "제작 중" : "다운로드"}
          </button>
          <button type="button" onClick={() => exportPoster("png")} disabled={exporting !== null}>
            <span>PNG</span>
            {exporting === "png" ? "제작 중" : "300dpi 다운로드"}
          </button>
        </div>
      </section>

      <div className="preview-stage" ref={stageRef}>
      <div className="preview-frame" style={{ width: `${POSTER_WIDTH * previewScale}px`, height: `${POSTER_HEIGHT * previewScale}px` }}>
      <div className="preview-scale" style={{ width: `${POSTER_WIDTH}px`, transform: `scale(${previewScale})` }}>
      <article
        className={`poster poster-${concept} px-[27px]! pt-[18px]! pb-[23px]! ${paletteClasses}`}
        style={{
          minHeight: 0,
          "--accent": palette.accent,
          "--line": palette.line,
          "--tone-bg": palette.bg,
          "--tone-fg": palette.fg,
          "--tone-muted": palette.muted,
          "--tone-alt": palette.alternate,
          "--tone-on-accent": palette.onAccent,
        } as CSSProperties}
        ref={posterRef}
        aria-label={`KMGM 논현점 ${monthNumber}월 유튜버 초청 일정 포스터`}
      >
        <span className="brand-watermark" aria-hidden="true" />
        <header className={`poster-header${concept === "ivory" ? " min-h-0! pb-[1.2%]!" : ""}`}>
          <div className="brand-lockup">
            <div className="brand-copy">
              <span className="header-label">KMGM NONHYEON</span>
              <span className="branch">YOUTUBER INVITATION</span>
            </div>
          </div>
          <div className={`month${concept === "ivory" ? " w-[clamp(2.5rem,7vw,3.5rem)]! [&_strong]:text-[clamp(1.2rem,3.5vw,1.8rem)]!" : ""}`}>
            <span>{months[monthNumber - 1]}</span>
            <strong>{monthNumber}</strong>
          </div>
        </header>

        <section className={`hero${concept === "ivory" ? " py-[2%]! after:hidden" : ""}`}>
          <div className={`eyebrow${concept === "ivory" ? " mb-[1%]!" : ""}`}>YOUTUBE CREATOR NIGHT</div>
          <h1 className={concept === "ivory" ? "text-[clamp(1.5rem,5vw,2.55rem)]! [&_span]:text-[0.48em]!" : ""}>
            <span>KMGM 논현점</span>
            {draft.title}
          </h1>
          <div className={`hero-subtitle${concept === "ivory" ? " mt-[1%]!" : ""}`}>
            <PlayIcon />
            <p>{draft.subtitle}</p>
          </div>
        </section>

        <section
          className={`schedule${concept === "ivory" ? [
            "[&_.table-head]:text-[clamp(0.55rem,1.7vw,0.9rem)]!",
            "[&_.table-head]:tracking-normal! [&_.table-head]:h-[clamp(2.5rem,7vw,3.5rem)]!",
            "[&_.table-head]:min-h-0! [&_.table-head]:shrink-0 [&_.table-head]:items-stretch!",
            "[&_.table-head_span]:flex [&_.table-head_span]:h-full [&_.table-head_span]:m-0 [&_.table-head_span]:p-0",
            "[&_.table-head_span]:items-center [&_.table-head_span]:justify-center [&_.table-head_span]:leading-none",
            "[&_.table-row]:items-stretch [&_.table-row>div]:min-w-0 [&_.table-row>div]:leading-none!",
            "[&_.date-cell_strong]:text-[length:calc(clamp(1rem,3.5vw,1.8rem)*var(--row-scale,1))]!",
            "[&_.date-cell_span]:text-[length:calc(clamp(0.5rem,1.5vw,0.8rem)*var(--row-scale,1))]!",
            "[&_.time-cell]:text-[length:calc(clamp(0.8rem,2.8vw,1.4rem)*var(--row-scale,1))]!",
            "[&_.entry-cell_strong]:text-[length:calc(clamp(0.8rem,2.8vw,1.4rem)*var(--row-scale,1))]!",
            "[&_.event-cell_span]:text-[length:calc(clamp(0.8rem,2.8vw,1.4rem)*var(--row-scale,1))]!",
            "[&_.date-cell_strong]:font-['Noto_Sans_KR']! [&_.entry-cell_strong]:font-['Noto_Sans_KR']!",
            "[&_.date-cell_strong]:font-extrabold! [&_.entry-cell_strong]:font-extrabold!",
            "[&_.event-cell_span]:font-extrabold! [&_.event-cell_span]:mb-[calc(0.375rem*var(--row-scale,1))]! [&_.event-cell_span]:whitespace-nowrap",
            "[&_.channel-cell]:justify-center! [&_.channel-cell]:px-[3%]!",
            "[&_.channel-cell_svg]:w-[calc(clamp(1rem,3.15vw,1.6rem)*var(--row-scale,1))]! [&_.channel-cell_svg]:shrink-0",
            "[&_.channel-cell_strong]:text-[length:calc(clamp(0.95rem,3.3vw,1.65rem)*var(--row-scale,1))]!",
            "[&_.channel-cell_strong]:text-center [&_.channel-cell_strong]:leading-none!",
            "[&_.event-cell_strong]:text-[length:calc(clamp(0.85rem,3vw,1.5rem)*var(--row-scale,1))]!",
          ].join(" ").replace(/^/, " ") : ""}`}
          style={{ "--row-scale": Math.min(1, BASE_ROWS / draft.rows.length) } as CSSProperties}
          aria-label={`${monthNumber}월 유튜버 초청 일정`}
        >
          <div className="table-head">
            {draft.headers.map((header, index) => <span key={index}>{header}</span>)}
          </div>
          <div className="table-body">
            {draft.rows.map((item) => (
              <div className="table-row" key={item.id}>
                <div className="date-cell">
                  <strong>{item.date}</strong>
                  <span>{item.day ? `(${item.day})` : ""}</span>
                </div>
                <div className="time-cell">{item.time}</div>
                <div className="channel-cell">
                  <PlayIcon />
                  <strong>{item.channel}</strong>
                </div>
                <div className="entry-cell">
                  <strong>{item.buyin}</strong>
                </div>
                <div className="event-cell">
                  <span>{item.event}</span>
                  <strong>{item.bonus}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className={`poster-footer${concept === "ivory" ? " pt-[2.5%]!" : ""}`}>
          <p>
            <span>{draft.footer}</span>
            KMGM 논현점에서 만나요
          </p>
          <div className="footer-note">
            <span>YOUTUBE CREATOR NIGHT</span>
            <span>KMGM NONHYEON</span>
          </div>
        </footer>
      </article>
      </div>
      </div>
      </div>
      </aside>
    </main>
  );
}

