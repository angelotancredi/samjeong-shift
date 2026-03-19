import { useState, useRef } from "react";

/**
 * 전용 모달 드래그 핸들링 훅
 * @param {Function} onClose 모달이 일정 거리 이상 내려갔을 때 호출될 함수
 * @param {number} threshold 모달을 닫기 위한 최소 드래그 거리 (기본값: 100)
 */
export function useModalDrag(onClose, threshold = 100) {
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(null);

  const onTouchStart = (e) => {
    // 이벤트 전파 방지 (배경 스와이프 등 방해 금지)
    e.stopPropagation();
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    e.stopPropagation();
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    // 아래로 드래그할 때만 움직임 허용
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const onTouchEnd = (e) => {
    e.stopPropagation();
    if (dragY > threshold) {
      onClose();
    } else {
      // 임계값을 넘지 못하면 다시 원위치로 (애니메이션 적용)
      setDragY(0);
    }
    touchStartY.current = null;
  };

  const dragStyle = {
    transform: `translateY(${dragY}px)`,
    transition: dragY === 0 ? "transform 0.2s ease-out" : "none",
  };

  return {
    dragY,
    bind: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    dragStyle,
  };
}
