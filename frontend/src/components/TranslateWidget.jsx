import React, { useEffect, useRef } from 'react';

export default function TranslateWidget() {
  const containerRef = useRef(null);

  useEffect(() => {
    const widget = document.getElementById('google_translate_element');
    
    if (widget && containerRef.current) {
      // Store original styles so we can restore them if needed
      const originalPosition = widget.style.position;
      const originalBottom = widget.style.bottom;
      const originalRight = widget.style.right;
      
      // Remove fixed positioning to flow with the flexbox container
      widget.style.position = 'relative';
      widget.style.bottom = 'auto';
      widget.style.right = 'auto';
      widget.style.zIndex = 'auto';
      
      // Move widget into this container
      containerRef.current.appendChild(widget);

      return () => {
        // Cleanup: Move it back to the body when this component unmounts
        // just in case we navigate to a page without a TranslateWidget
        document.body.appendChild(widget);
        widget.style.position = 'fixed';
        widget.style.bottom = '24px';
        widget.style.right = '24px';
        widget.style.zIndex = '9999';
      };
    }
  }, []);

  return <div ref={containerRef} className="translate-widget-container min-h-[38px]"></div>;
}
