'use client';

import { useState, type ReactNode } from 'react';
import { ELEMENT_LABEL, WALLS, WALL_LABEL, isWallElement, type ArchitecturalElement, type Glazing } from '@/lib/room-studio/architecture';
import type { RoomProposal } from '@/lib/room-studio/roomProposal';

const field = 'mt-1 w-full rounded border border-[#D8E2EA] bg-white px-2 py-1.5 text-[13px] text-[#263642]';
const action = 'rounded border border-[#D8E2EA] px-2.5 py-1.5 text-xs font-medium';
type Kind = ArchitecturalElement['type'];
const addLabel: Record<Kind, string> = { 'entrance-door': 'Thêm cửa', window: 'Thêm cửa sổ', 'shower-partition': 'Thêm vách kính' };
const removeLabel: Record<Kind, string> = { 'entrance-door': 'Gỡ cửa', window: 'Gỡ cửa sổ', 'shower-partition': 'Gỡ vách kính' };

interface EditorProps {
  elements: ArchitecturalElement[];
  selected?: ArchitecturalElement;
  plan: ReactNode;
  proposal: RoomProposal | null;
  onAdd: (kind: Kind) => void;
  onSelect: (id: string) => void;
  onChange: (element: ArchitecturalElement) => void;
  onRemove: () => void;
  onApply: () => void;
  onDiscard: () => void;
}

function Choice<T extends string>({ label, value, options, change }: {
  label: string; value: T; options: readonly (readonly [T, string])[]; change: (v: T) => void;
}) {
  return <label>{label}<select className={field} aria-label={label} value={value} onChange={e => change(e.target.value as T)}>
    {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
  </select></label>;
}

function Fields({ selected: el, proposal, onChange, onRemove, onApply, onDiscard }: Pick<EditorProps,
  'selected' | 'proposal' | 'onChange' | 'onRemove' | 'onApply' | 'onDiscard'>) {
  const [empty, setEmpty] = useState<string[]>([]);
  const removing = proposal?.operations[0]?.op === 'element.remove';
  function number(label: string, value: number, change: (v: number) => void, scale = 100) {
    return <label>{label}<input type="number" step="any" className={field} required
      value={empty.includes(label) ? '' : Number((value * scale).toFixed(3))}
      onChange={e => {
        const n = e.target.valueAsNumber;
        setEmpty(old => Number.isFinite(n) ? old.filter(f => f !== label) : [...new Set([...old, label])]);
        if (Number.isFinite(n)) change(n / scale);
      }} /></label>;
  }
  const openable = el && (el.mechanism === 'hinged' || el.mechanism === 'sliding' || el.mechanism === 'casement');
  return <>
    {el && !removing && <>
      <div className="grid grid-cols-2 gap-2">
        {isWallElement(el) ? <>
          <Choice label={el.type === 'window' ? 'Tường cửa sổ' : 'Tường đặt cửa'} value={el.wall}
            options={WALLS.map(w => [w, WALL_LABEL[w]])} change={wall => onChange({ ...el, wall })} />
          {number('Cách đầu tường (cm)', el.offset, offset => onChange({ ...el, offset }))}
          {number(el.type === 'window' ? 'Rộng cửa sổ (cm)' : 'Rộng cửa (cm)', el.width, width => onChange({ ...el, width }))}
        </> : <>
          {number('Tâm X (cm)', el.x, x => onChange({ ...el, x }))}
          {number('Tâm Z (cm)', el.z, z => onChange({ ...el, z }))}
          {number('Dài toàn bộ (cm)', el.length, length => onChange({ ...el, length }))}
          {number('Góc xoay (°)', el.rotation, rotation => onChange({ ...el, rotation }), 1)}
        </>}
        {number(el.type === 'entrance-door' ? 'Cao cửa (cm)' : 'Chiều cao (cm)', el.height, height => onChange({ ...el, height }))}
        {el.type === 'entrance-door' && <>
          <Choice label="Bản lề" value={el.hinge} options={[['left', 'Trái'], ['right', 'Phải']]} change={hinge => onChange({ ...el, hinge })} />
          <Choice label="Hướng mở" value={el.swing} options={[['inward', 'Vào trong'], ['outward', 'Ra ngoài']]} change={swing => onChange({ ...el, swing })} />
        </>}
        {el.type === 'window' && <>
          {number('Cao bậu (cm)', el.sill, sill => onChange({ ...el, sill }))}
          <Choice label="Kiểu cửa sổ" value={el.mechanism} options={[['fixed', 'Cố định'], ['casement', 'Mở quay ra ngoài']]}
            change={mechanism => onChange({ ...el, mechanism, open: false })} />
          <Choice label="Khung" value={el.frame} options={[['graphite', 'Than chì'], ['ivory', 'Trắng ngà']]} change={frame => onChange({ ...el, frame })} />
        </>}
        {el.type === 'shower-partition' && <>
          <Choice label="Kiểu vách" value={el.mechanism}
            options={[['fixed', 'Tấm cố định'], ['walk-in', 'Vách hở lối vào'], ['hinged', 'Cửa bản lề'], ['sliding', 'Cửa trượt']]}
            change={mechanism => onChange({ ...el, mechanism, open: false })} />
          {el.mechanism !== 'fixed' && <Choice label="Bên lối vào" value={el.entrySide} options={[['left', 'Đầu trái'], ['right', 'Đầu phải']]}
            change={entrySide => onChange({ ...el, entrySide })} />}
          {el.mechanism === 'hinged' && <Choice label="Chiều mở" value={el.swing} options={[['forward', 'Phía trước'], ['reverse', 'Phía sau']]}
            change={swing => onChange({ ...el, swing })} />}
        </>}
        {el.type !== 'entrance-door' && <Choice<Glazing> label="Bề mặt kính" value={el.glazing}
          options={[['clear', 'Kính trong'], ['frosted', 'Kính mờ'], ['tinted', 'Kính ám xanh']]} change={glazing => onChange({ ...el, glazing })} />}
      </div>
      {empty.length > 0 && <p role="alert" className="text-red-700">Vui lòng nhập đủ số đo.</p>}
      <p>{isWallElement(el) ? 'Vị trí đo từ đầu tường bên trái khi nhìn từ trong phòng.' : 'Tọa độ tính từ tâm phòng. Góc dương xoay theo chiều kim đồng hồ trên sơ đồ.'}</p>
      <div className="flex items-center justify-between gap-2">
        {openable && <label className="flex items-center gap-2"><input type="checkbox" checked={el.open}
          onChange={e => onChange({ ...el, open: e.target.checked })} />Hiện cửa mở</label>}
        {proposal?.operations[0]?.op !== 'element.add' && <button type="button" className="underline underline-offset-2" onClick={onRemove}>{removeLabel[el.type]}</button>}
      </div>
    </>}
    {proposal && <div className="space-y-2 border-l-2 border-[#C8A96A] pl-2.5" aria-live="polite">
      <p className="font-medium text-[#263642]">Xem trước · {proposal.label}</p>
      {proposal.errors.map((message, i) => <p key={i} className="text-red-700">{message}</p>)}
      {proposal.findings.filter(f => f.reason && ['entrance-door', 'glass-architecture'].includes(f.ruleId)).map(f => <p key={f.id}>{f.message}</p>)}
      <div className="flex gap-2"><button type="button" disabled={!proposal.eligible || (!removing && empty.length > 0)}
        onClick={onApply} className="rounded bg-[#162938] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Áp dụng</button>
        <button type="button" className={action} onClick={() => { setEmpty([]); onDiscard(); }}>Bỏ bản xem trước</button></div>
    </div>}
  </>;
}

export default function ArchitectureEditor(props: EditorProps) {
  const { elements, selected, proposal, plan, onAdd, onSelect } = props;
  return <div className="my-3 space-y-3 border-y border-[#E2E7E9] py-3 text-[12px] text-[#52616C]">
    {!proposal && <div className="flex flex-wrap gap-1.5">{(Object.keys(addLabel) as Kind[]).map(kind =>
      <button key={kind} type="button" className={action} onClick={() => onAdd(kind)}>{addLabel[kind]}</button>)}</div>}
    {elements.length > 1 && <label className="block">Chi tiết đang chọn
      <select className={field} disabled={!!proposal} value={selected?.id ?? ''} onChange={e => onSelect(e.target.value)}>
        {elements.map((el, i) => <option key={el.id} value={el.id}>{i + 1} · {ELEMENT_LABEL[el.type]}{isWallElement(el) ? ' · ' + WALL_LABEL[el.wall] : ''}</option>)}
      </select>
    </label>}
    {elements.length > 0 && plan}
    <Fields key={selected?.id ?? 'removed'} {...props} />
  </div>;
}
