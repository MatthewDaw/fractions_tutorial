// cast.jsx — the counter cast: Kid sibling, Grandpa, picky Cat. Woodcut two-tone
// line-art, same skin as the Cook / Mom tutors. Ported from the design bundle.
// expr: 'idle' | 'asking' | 'happy'
import { C, useUID, AssetDefs } from "./kit.jsx";

/* ───────────── Kid sibling (apprentice) ───────────── */
export function Kid({ expr = "idle", width = 150 }) {
  const u = useUID();
  const asking = expr === "asking", happy = expr === "happy";
  return (
    <svg width={width} height={width * (220 / 150)} viewBox="0 0 150 220" style={{ display: "block", overflow: "visible" }}>
      <AssetDefs uid={u} />
      <g stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M40 218 Q36 148 52 134 Q64 124 75 124 Q86 124 98 134 Q114 148 110 218 Z" fill={C.paper1} />
        <path d="M58 134 Q75 142 92 134 L100 218 L50 218 Z" fill={`url(#rh-${u})`} />
        <path d={asking ? "M98 138 Q120 124 116 104" : "M98 138 Q118 158 120 184"} fill="none" />
        <path d="M52 138 Q34 160 32 184" fill="none" />
      </g>
      <circle cx={asking ? 116 : 120} cy={asking ? 100 : 186} r="7" fill={C.paper1} stroke={C.ink} strokeWidth="2.2" />
      <circle cx="32" cy="186" r="7" fill={C.paper1} stroke={C.ink} strokeWidth="2.2" />
      <circle cx="75" cy="78" r="34" fill={C.paper1} stroke={C.ink} strokeWidth="2.6" />
      <path d="M96 60 A34 34 0 0 1 98 96 Q88 100 86 70 Z" fill={`url(#lh-${u})`} stroke="none" opacity="0.5" />
      {[[60, 84], [66, 88], [84, 88], [90, 84]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="1.5" fill={C.redSoft} />)}
      {happy ? (
        <g stroke={C.ink} strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M58 74 Q64 67 70 74" /><path d="M80 74 Q86 67 92 74" />
        </g>
      ) : (
        <g fill={C.ink}>
          <circle cx={asking ? 65 : 64} cy="74" r="3.2" /><circle cx={asking ? 86 : 86} cy="74" r="3.2" />
          {asking && <path d="M78 62 Q86 58 94 63" stroke={C.ink} strokeWidth="2" fill="none" strokeLinecap="round" />}
        </g>
      )}
      <path d="M75 80 q3 5 -1 7" stroke={C.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {happy ? (
        <path d="M62 92 Q75 106 88 92 Q80 99 75 99 Q70 99 62 92 Z" fill={C.redDeep} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
      ) : asking ? (
        <ellipse cx="75" cy="95" rx="5" ry="6" fill={C.redDeep} stroke={C.ink} strokeWidth="2" />
      ) : (
        <path d="M64 92 Q75 100 86 92" stroke={C.ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
      <g stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round">
        <path d="M40 72 Q39 64 42 62 Q32 48 44 42 Q46 32 58 37 Q66 28 76 35 Q86 29 94 37 Q107 34 106 48 Q116 54 108 62 Q111 64 110 72 Q75 65 40 72 Z"
          fill={C.paper2} />
        <path d="M40 72 Q39 64 42 62 Q32 48 44 42 Q46 32 58 37 Q66 28 76 35 Q86 29 94 37 Q107 34 106 48 Q116 54 108 62 Q111 64 110 72 Q75 65 40 72 Z"
          fill={`url(#lh-${u})`} stroke="none" opacity="0.26" />
        <path d="M41 63 Q75 56 109 63 Q110 67 110 72 Q75 65 40 72 Q40 67 41 63 Z" fill={C.paper3} stroke="none" />
        <path d="M41 63 Q75 56 109 63" stroke={C.ink} strokeWidth="1.6" fill="none" />
        <path d="M45 67 Q75 60 105 67" stroke={C.red} strokeWidth="1.6" fill="none" opacity="0.85" />
        <path d="M60 39 Q61 49 59 57 M76 36 Q73 48 75 57 M93 39 Q92 49 92 57" stroke={C.ink} strokeWidth="1.2" fill="none" opacity="0.45" />
      </g>
      {happy && (
        <g stroke={C.red} strokeWidth="2" strokeLinecap="round">
          <line x1="120" y1="40" x2="120" y2="50" /><line x1="115" y1="45" x2="125" y2="45" />
        </g>
      )}
    </svg>
  );
}

/* ───────────── Grandpa ───────────── */
export function Grandpa({ expr = "idle", width = 150 }) {
  const u = useUID();
  const asking = expr === "asking", happy = expr === "happy";
  return (
    <svg width={width} height={width * (220 / 150)} viewBox="0 0 150 220" style={{ display: "block", overflow: "visible" }}>
      <AssetDefs uid={u} />
      <g stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M38 218 Q36 136 56 126 Q66 120 75 120 Q84 120 94 126 Q114 136 112 218 Z" fill={C.paper1} />
        <path d="M52 128 Q42 158 40 186" fill="none" />
        <path d="M98 128 Q108 158 110 186" fill="none" />
      </g>
      <g stroke={C.redDeep} strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M62 128 L60 218" /><path d="M88 128 L90 218" />
      </g>
      <circle cx="38" cy="188" r="7" fill={C.paper1} stroke={C.ink} strokeWidth="2.2" />
      <circle cx="112" cy="188" r="7" fill={C.paper1} stroke={C.ink} strokeWidth="2.2" />
      <circle cx="75" cy="76" r="35" fill={C.paper1} stroke={C.ink} strokeWidth="2.6" />
      <path d="M98 58 A35 35 0 0 1 99 96 Q90 100 88 70 Z" fill={`url(#lh-${u})`} stroke="none" opacity="0.5" />
      <path d="M54 56 Q44 53 41 61 Q32 60 33 70 Q27 73 32 81 Q31 90 41 88 Q49 86 50 77 Q48 67 54 60 Z" fill={C.paper2} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M40 64 q2 9 0 18 M46 62 q1 9 0 17" stroke={C.ink} strokeWidth="1.2" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M96 56 Q106 53 109 61 Q118 60 117 70 Q123 73 118 81 Q119 90 109 88 Q101 86 100 77 Q102 67 96 60 Z" fill={C.paper2} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M110 64 q-2 9 0 18 M104 62 q-1 9 0 17" stroke={C.ink} strokeWidth="1.2" fill="none" opacity="0.5" strokeLinecap="round" />
      <g stroke={C.ink} strokeWidth="2.2" fill="none">
        <circle cx="62" cy="72" r="11" fill={C.paper1} fillOpacity="0.4" />
        <circle cx="88" cy="72" r="11" fill={C.paper1} fillOpacity="0.4" />
        <line x1="73" y1="72" x2="77" y2="72" />
      </g>
      {happy ? (
        <g stroke={C.ink} strokeWidth="2.2" fill="none" strokeLinecap="round">
          <path d="M56 73 Q62 68 68 73" /><path d="M82 73 Q88 68 94 73" />
        </g>
      ) : (
        <g fill={C.ink}>
          <circle cx="62" cy="73" r="2.8" /><circle cx="88" cy="73" r="2.8" />
          <path d={asking ? "M80 58 Q88 54 96 59" : "M82 60 Q88 58 94 60"} stroke={C.ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M54 60 Q60 58 66 60" stroke={C.ink} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}
      <path d="M54 96 Q62 90 75 94 Q88 90 96 96 Q90 106 75 102 Q60 106 54 96 Z" fill={C.inkSoft} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
      <path d="M54 96 Q62 90 75 94 Q88 90 96 96 Q90 106 75 102 Q60 106 54 96 Z" fill={`url(#lh-${u})`} stroke="none" opacity="0.6" />
      {happy ? (
        <path d="M64 104 Q75 114 86 104" stroke={C.redDeep} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ) : asking ? (
        <ellipse cx="75" cy="108" rx="4.5" ry="5" fill={C.redDeep} stroke={C.ink} strokeWidth="1.8" />
      ) : (
        <path d="M66 106 Q75 110 84 106" stroke={C.ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}
      {happy && (
        <g stroke={C.red} strokeWidth="2" strokeLinecap="round">
          <line x1="118" y1="44" x2="118" y2="54" /><line x1="113" y1="49" x2="123" y2="49" />
        </g>
      )}
    </svg>
  );
}

/* ───────────── Picky Cat ───────────── */
export function Cat({ expr = "idle", width = 150 }) {
  const u = useUID();
  const asking = expr === "asking", happy = expr === "happy";
  return (
    <svg width={width} height={width * (220 / 150)} viewBox="0 0 150 220" style={{ display: "block", overflow: "visible" }}>
      <AssetDefs uid={u} />
      <path d="M112 196 Q140 188 134 158 Q130 138 116 146" fill="none" stroke={C.ink} strokeWidth="9" strokeLinecap="round" />
      <path d="M112 196 Q140 188 134 158 Q130 138 116 146" fill="none" stroke={`url(#lh-${u})`} strokeWidth="5" strokeLinecap="round" opacity="0.5" />
      <path d="M44 210 Q40 142 75 138 Q110 142 106 210 Z" fill={C.paper2} stroke={C.ink} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M44 210 Q40 142 75 138 Q110 142 106 210 Z" fill={`url(#lh-${u})`} stroke="none" opacity="0.4" />
      <ellipse cx="62" cy="208" rx="9" ry="7" fill={C.paper1} stroke={C.ink} strokeWidth="2.2" />
      {asking
        ? <ellipse cx="92" cy="178" rx="8" ry="7" fill={C.paper1} stroke={C.ink} strokeWidth="2.2" className="anim-lift" />
        : <ellipse cx="90" cy="208" rx="9" ry="7" fill={C.paper1} stroke={C.ink} strokeWidth="2.2" />}
      <path d="M58 142 Q75 154 92 142" stroke={C.red} strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="75" cy="151" r="3.4" fill={C.redDeep} stroke={C.ink} strokeWidth="1.4" />
      <path d="M50 96 L46 64 L70 80 Z" fill={C.paper2} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M100 96 L104 64 L80 80 Z" fill={C.paper2} stroke={C.ink} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M52 70 L50 86 M98 70 L100 86" stroke={C.redSoft} strokeWidth="3" strokeLinecap="round" />
      <circle cx="75" cy="100" r="32" fill={C.paper1} stroke={C.ink} strokeWidth="2.6" />
      <path d="M96 84 A32 32 0 0 1 97 118 Q88 120 88 92 Z" fill={`url(#lh-${u})`} stroke="none" opacity="0.45" />
      {happy ? (
        <g stroke={C.ink} strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M60 98 Q66 92 72 98" /><path d="M78 98 Q84 92 90 98" />
        </g>
      ) : (
        <g>
          <ellipse cx="66" cy="98" rx="5" ry={asking ? 7 : 6} fill={C.paper1} stroke={C.ink} strokeWidth="2" />
          <ellipse cx="84" cy="98" rx="5" ry={asking ? 7 : 6} fill={C.paper1} stroke={C.ink} strokeWidth="2" />
          <ellipse cx="66" cy="98" rx={asking ? 3.4 : 1.6} ry={asking ? 5 : 5.5} fill={C.ink} />
          <ellipse cx="84" cy="98" rx={asking ? 3.4 : 1.6} ry={asking ? 5 : 5.5} fill={C.ink} />
          {!asking && <path d="M58 90 L72 92 M92 90 L78 92" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" />}
        </g>
      )}
      <path d="M71 108 L79 108 L75 113 Z" fill={C.red} stroke={C.ink} strokeWidth="1.4" strokeLinejoin="round" />
      {happy ? (
        <path d="M75 113 Q68 120 62 116 M75 113 Q82 120 88 116" stroke={C.ink} strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M75 113 L75 117 M75 117 Q70 121 66 119 M75 117 Q80 121 84 119" stroke={C.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}
      <g stroke={C.ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
        <path d="M58 110 L34 106 M58 114 L36 118" />
        <path d="M92 110 L116 106 M92 114 L114 118" />
      </g>
      {happy && (
        <g stroke={C.red} strokeWidth="2" strokeLinecap="round">
          <line x1="116" y1="62" x2="116" y2="72" /><line x1="111" y1="67" x2="121" y2="67" />
        </g>
      )}
    </svg>
  );
}

export const CAST = { kid: Kid, grandpa: Grandpa, cat: Cat };
