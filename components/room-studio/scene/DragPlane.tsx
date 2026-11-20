import { Plane, Raycaster, Vector2, Vector3, type Camera } from 'three';
import type { PlacedProduct } from '@/lib/room-studio/roomState';
import type { Vec3 } from '@/lib/room-studio/placementRules';

/**
 * The fixture mesh owns picking. Once picked, track that pointer against its
 * mounting plane directly. An annotation or another mesh can cover the plane
 * during a drag, and releasing beyond the canvas must still finish the edit.
 */
export function trackPlaneDrag(
  placed: PlacedProduct,
  grab: Vector3,
  camera: Camera,
  canvas: Element,
  down: PointerEvent,
  onMove: (position: Vec3, tolerance: number) => void,
  onEnd: (cancel: boolean) => void,
) {
  const normal = new Vector3(0, 1, 0);
  if (placed.placementType === 'wall') {
    if (placed.wall === 'left' || placed.wall === 'right') normal.set(1, 0, 0);
    else normal.set(0, 0, 1);
  }
  const plane = new Plane().setFromNormalAndCoplanarPoint(normal, grab);
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const hit = new Vector3();
  const project = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    ndc.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(plane, hit);
  };
  const start = project(down)?.clone();
  let previousX = down.clientX;
  let previousY = down.clientY;
  const move = (event: PointerEvent) => {
    if (event.pointerId !== down.pointerId || !start) return;
    if (event.clientX === previousX && event.clientY === previousY) return;
    previousX = event.clientX;
    previousY = event.clientY;
    if (!project(event)) return;
    const screen = hit.clone().project(camera);
    screen.x += 16 / canvas.getBoundingClientRect().width;
    const tolerance = screen.unproject(camera).distanceTo(hit);
    onMove([placed.position[0] + hit.x - start.x, placed.position[1] + hit.y - start.y, placed.position[2] + hit.z - start.z], tolerance);
  };
  let frame=0, pending:PointerEvent|null=null;
  const schedule=(event:PointerEvent)=>{
    if(event.pointerId!==down.pointerId)return;
    pending=event;
    if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(pending)move(pending);pending=null;});
  };
  const finish = (cancelled: boolean) => {
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', schedule, true);
    window.removeEventListener('pointerup', up, true);
    window.removeEventListener('pointercancel', cancelledPointer, true);
    window.removeEventListener('blur', cancel);
    onEnd(cancelled);
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId !== down.pointerId) return;
    move(event);
    finish(false);
  };
  const cancelledPointer = (event: PointerEvent) => {
    if (event.pointerId === down.pointerId) finish(true);
  };
  const cancel = () => finish(true);
  window.addEventListener('pointermove', schedule, true);
  window.addEventListener('pointerup', up, true);
  window.addEventListener('pointercancel', cancelledPointer, true);
  window.addEventListener('blur', cancel);
  return cancel;
}
