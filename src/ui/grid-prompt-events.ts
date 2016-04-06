{
  const bodyKeyHandlers: {
    which: number,
    shiftKey?: boolean,
    altKey?: boolean,
    ctrlKey?: boolean,
    condition?: () => boolean,
    action: () => void,
  }[] = [
    // Esc キー: 選択解除
    {
      which: 27,
      condition: () => document.activeElement === document.body,
      action: () => document.getSelection().removeAllRanges(),
    },
    // Ctrl + N: 新規ウィンドウ
    {
      which: 'N'.charCodeAt(0),
      ctrlKey: true,
      action: () => (<any>window).gridPrompt.addPrompt(),
    },
  ];

  /**
   * document.body のキーイベントを処理します。
   */
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const handler = bodyKeyHandlers.find(x =>
      event.which === x.which &&
      event.shiftKey === !!x.shiftKey &&
      event.altKey === !!x.altKey &&
      event.ctrlKey === !!x.ctrlKey &&
      (!x.condition || x.condition())
    );
    handler && handler.action && handler.action();
  }, false);

  /**
   * document.body がアクティブ要素になっても誰も得しないので
   * 直前のフォーカスを維持するよう変更します。
   */
  {
    let previousFocused: HTMLElement = undefined;
    let focusPrevious = () => {
      if (previousFocused && document.activeElement === document.body && document.getSelection().isCollapsed) {
        previousFocused.focus();
      }
    };
    window.addEventListener('blur', (event: FocusEvent) => {
      if (event.target !== document.body) {
        previousFocused = event.target as HTMLElement;
        setTimeout(focusPrevious, 0);
      }
    }, true);
    document.addEventListener('selectionchange', focusPrevious, true);
  }
}
