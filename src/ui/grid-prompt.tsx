import { spawn, ChildProcess } from 'child_process';
import * as React from 'react';
const ReactGridLayout = require('react-grid-layout');
const iconv = require('iconv-lite');

/**
 * 1 つのコマンドプロンプトを表します。
 */
class Prompt extends React.Component<{ className?: string, style?: { [prop: string]: string }, title?: string, onExit?: (prompt: Prompt) => void }, { output: string }> {
  static defaultProps = { className: '', style: {}, title: 'Prompt' };
  state = { output: '' };
  refs: {
    [key: string]: React.ReactInstance;
    self: HTMLElement;
    input: HTMLElement;
  };

  process = (() => {
    const process = spawn('cmd');
    process.on('exit', () => this.props.onExit && this.props.onExit(this));
    process.stdout.on('data', (data: Buffer) => this.setState({ output: this.state.output + iconv.decode(data, 'cp932') }));
    process.stderr.on('data', (data: Buffer) => this.setState({ output: this.state.output + iconv.decode(data, 'cp932') }));
    return process;
  })();

  render(): React.ReactElement<any> {
    return (
      <table className='prompt' cellPadding='2' cellSpacing='0'>
        <tbody>
          <tr height='1'>
            <td>
              <button className='prompt-close' title='閉じる' tabIndex='-1' onClick={ event => this.process.kill() }>×</button>
              <div className='prompt-header'>{this.props.title}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div ref='self' className='prompt-body' onClick={ event => this.focusInput() }>
                <span>{this.state.output}</span>
                <span className='prompt-input' ref='input' contentEditable onKeyDown={ event => this.onKeyDown(event) }></span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  componentWillUnmount(): void {
    this.process.kill();
  }

  componentDidMount(): void {
    this.focusInput();
  }

  componentDidUpdate(): void {
    this.refs.self.scrollTop = this.refs.self.scrollHeight;
  }

  focusInput(): void {
    if (document.getSelection().isCollapsed) {
      this.refs.input.focus();
    }
  }

  selectContents() {
    let range = document.createRange();
    range.selectNodeContents(this.refs.self);

    let selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  onKeyDown(event: React.KeyboardEvent): void {
    const child: ChildProcess = this.process;
    const element: HTMLElement = event.target as HTMLElement;
    if (event.altKey) {
      return;
    }
    if (event.ctrlKey) {
      switch (String.fromCharCode(event.which)) {
        case 'V':   // 貼り付け (デフォルト)
          return;
        case 'A':   // プロンプト全選択
          this.selectContents();
          event.preventDefault();
          event.stopPropagation();
          return;
        case 'C':
          if (document.getSelection().isCollapsed) {
            // todo: ^C 送信
            event.preventDefault();
            event.stopPropagation();
          } else {
            // 選択文字列のコピー (デフォルト)
          }
          return;
        case 'Z':
          // todo: ^Z 送信
          event.preventDefault();
          event.stopPropagation();
          return;
      }
    } else switch (event.which) {
      case 13:  // Return
        child.stdin.write(element.textContent + '\n');
        element.textContent = '';
        event.preventDefault();
        event.stopPropagation();
        break;
      case 27:  // Esc
        if (document.getSelection().isCollapsed) {
          element.textContent = '';
          event.preventDefault();
          event.stopPropagation();
        }
        break;
    }
  }
}

/**
 * コマンドプロンプトのグリッドを表します。
 */
class GridPrompt extends React.Component<{}, { prompts: React.ReactElement<any>[] }> {
  addButton = (
    <div key={-1} _grid={{ x: 0, y: 0, w: 1, h: 1, isResizable: false }}>
      <button className='grid-prompt-add' onClick={ event => this.addPrompt() }>+</button>
    </div>
  );

  constructor(props: Object) {
    super(props);
    this.state = { prompts: [] };
  }

  render(): React.ReactElement<any> {
    return (
      <ReactGridLayout className='grid-prompt' cols={12} rowHeight={64} width={1920} margin={[4, 4]} draggableHandle='.prompt-header'>
        {this.state.prompts.filter(x => !!x).concat(this.addButton) }
      </ReactGridLayout>
    );
  }

  addPrompt(): void {
    const index = this.state.prompts.length;
    const remove = () => {
      let prompts = this.state.prompts.concat();
      delete prompts[index];
      this.setState({ prompts: prompts });
    };
    const prompt = (
      <div key={index} _grid={{ x: 0, y: Infinity, w: 4, h: 4 }}>
        <Prompt onExit={remove} title={ 'Prompt ' + (index + 1) } />
      </div>
    );
    this.setState({
      prompts: this.state.prompts.concat(prompt),
    });
  }
}

import { render } from 'react-dom';
const gridPrompt = render(<GridPrompt />, document.querySelector('#grid-prompt'));
