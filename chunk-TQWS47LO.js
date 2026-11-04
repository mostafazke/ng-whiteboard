import{b as c}from"./chunk-IFVNBDVN.js";import"./chunk-KEOIA5MT.js";import"./chunk-6YQVCWSX.js";import{Zb as n,cb as a,yb as e,zb as t}from"./chunk-J4RLERFJ.js";var m=(()=>{let o=class o{};o.\u0275fac=function(i){return new(i||o)},o.\u0275cmp=a({type:o,selectors:[["app-getting-started"]],decls:94,vars:0,consts:[[1,"doc-section"],[1,"material-icons"],[1,"subsection"],["routerLink","/documentation/api-reference"],["routerLink","/documentation/keyboard-shortcuts"],["routerLink","/examples"],["href","https://github.com/mostafazke/ng-whiteboard","target","_blank"]],template:function(i,g){i&1&&(e(0,"div",0)(1,"h2")(2,"span",1),n(3,"rocket_launch"),t(),n(4," Getting Started"),t(),e(5,"section",2)(6,"h3")(7,"span",1),n(8,"download"),t(),n(9," Installation"),t(),e(10,"p"),n(11,"Install ng-whiteboard via npm or yarn:"),t(),e(12,"pre")(13,"code"),n(14,`npm install ng-whiteboard
# or
yarn add ng-whiteboard`),t()()(),e(15,"section",2)(16,"h3")(17,"span",1),n(18,"build"),t(),n(19," Basic Setup"),t(),e(20,"h4"),n(21,"For Standalone Components"),t(),e(22,"p"),n(23,"Import the component directly in your standalone component:"),t(),e(24,"pre")(25,"code"),n(26,`import { Component } from '@angular/core';
import { NgWhiteboardComponent } from 'ng-whiteboard';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [NgWhiteboardComponent],
  template: '<ng-whiteboard></ng-whiteboard>'
})
export class MyComponent {}`),t()(),e(27,"h4"),n(28,"For NgModules"),t(),e(29,"p"),n(30,"Import the component in your module:"),t(),e(31,"pre")(32,"code"),n(33,`import { NgWhiteboardComponent } from 'ng-whiteboard';

@NgModule({
  imports: [NgWhiteboardComponent],
  // other imports
})
export class AppModule {}`),t()()(),e(34,"section",2)(35,"h3"),n(36,"\u{1F4BB} Basic Usage"),t(),e(37,"p"),n(38,"Here's a simple working example. It renders the board with the built-in editor:"),t(),e(39,"pre")(40,"code"),n(41,"<ng-whiteboard></ng-whiteboard>"),t()(),e(42,"p"),n(43,"To render only the canvas, for example under your own editor UI, turn the editor off:"),t(),e(44,"pre")(45,"code"),n(46,'<ng-whiteboard [showEditor]="false"></ng-whiteboard>'),t()()(),e(47,"section",2)(48,"h3")(49,"span",1),n(50,"settings"),t(),n(51," Configuration Example"),t(),e(52,"p"),n(53,"Configure the whiteboard with custom options:"),t(),e(54,"pre")(55,"code"),n(56,`import { Component } from '@angular/core';
import { NgWhiteboardComponent, WhiteboardConfig } from 'ng-whiteboard';

@Component({
  selector: 'app-configured-whiteboard',
  standalone: true,
  imports: [NgWhiteboardComponent],
  template: \`
    <ng-whiteboard
      [config]="whiteboardConfig"
      (ready)="onReady()"
      (dataChange)="onDataChange($event)"
    ></ng-whiteboard>
  \`
})
export class ConfiguredWhiteboardComponent {
  whiteboardConfig: Partial<WhiteboardConfig> = {
    canvasWidth: 1024,
    canvasHeight: 768,
    fullScreen: false,
    strokeColor: '#2c80b1',
    strokeWidth: 3,
    backgroundColor: '#ffffff'
  };

  onReady() {
    console.log('Whiteboard is ready!');
  }

  onDataChange(data: any[]) {
    console.log('Data changed:', data);
  }
}`),t()()(),e(57,"section",2)(58,"h3")(59,"span",1),n(60,"track_changes"),t(),n(61," Using the Service API"),t(),e(62,"p"),n(63,"For programmatic control, inject "),e(64,"code"),n(65,"NgWhiteboardService"),t(),n(66,":"),t(),e(67,"pre")(68,"code"),n(69,`import { Component, inject } from '@angular/core';
import { NgWhiteboardComponent, NgWhiteboardService } from 'ng-whiteboard';

@Component({
  selector: 'app-interactive-whiteboard',
  standalone: true,
  imports: [NgWhiteboardComponent],
  providers: [NgWhiteboardService],
  template: \`
    <ng-whiteboard [boardId]="boardId"></ng-whiteboard>
    <button (click)="undo()">Undo</button>
    <button (click)="redo()">Redo</button>
    <button (click)="clear()">Clear</button>
  \`
})
export class InteractiveWhiteboardComponent {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'my-board';

  ngOnInit() {
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  undo() {
    this.whiteboardService.undo();
  }

  redo() {
    this.whiteboardService.redo();
  }

  clear() {
    this.whiteboardService.clear();
  }
}`),t()()(),e(70,"section",2)(71,"h3"),n(72,"\u{1F4DA} Next Steps"),t(),e(73,"ul")(74,"li"),n(75," Explore the "),e(76,"a",3),n(77,"API Reference"),t(),n(78," for all available inputs, outputs, and methods "),t(),e(79,"li"),n(80," Check out "),e(81,"a",4),n(82,"Keyboard Shortcuts"),t(),n(83," to boost your productivity "),t(),e(84,"li"),n(85,"View "),e(86,"a",5),n(87,"Examples"),t(),n(88," for more complex use cases and implementations"),t(),e(89,"li"),n(90," Visit our "),e(91,"a",6),n(92,"GitHub repository"),t(),n(93," for issues and contributions "),t()()()())},dependencies:[c],styles:[".doc-section[_ngcontent-%COMP%]{max-width:900px;padding:var(--spacing-2xl);margin:0 auto}.doc-section[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{color:var(--color-text-primary);margin-bottom:var(--spacing-2xl);font-size:var(--font-size-3xl);font-weight:var(--font-weight-bold);line-height:var(--line-height-tight);display:flex;align-items:center;gap:var(--spacing-sm)}.doc-section[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]   .material-icons[_ngcontent-%COMP%]{font-size:var(--font-size-3xl);color:var(--color-accent)}.doc-section[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%]{color:var(--color-text-primary);margin-bottom:var(--spacing-lg);margin-top:var(--spacing-2xl);font-size:var(--font-size-2xl);font-weight:var(--font-weight-semibold);line-height:var(--line-height-tight);border-bottom:2px solid var(--color-border-primary);padding-bottom:var(--spacing-sm);display:flex;align-items:center;gap:var(--spacing-sm)}.doc-section[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%]   .material-icons[_ngcontent-%COMP%]{font-size:var(--font-size-2xl);color:var(--color-accent)}.doc-section[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%]{color:var(--color-text-primary);margin-bottom:var(--spacing-md);margin-top:var(--spacing-xl);font-size:var(--font-size-xl);font-weight:var(--font-weight-semibold);display:flex;align-items:center;gap:var(--spacing-sm)}.doc-section[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%]   .material-icons[_ngcontent-%COMP%]{font-size:var(--font-size-xl);color:var(--color-accent)}.doc-section[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{line-height:var(--line-height-relaxed);color:var(--color-text-secondary);margin-bottom:var(--spacing-lg);font-size:var(--font-size-base)}.doc-section[_ngcontent-%COMP%]   pre[_ngcontent-%COMP%]{background:var(--color-bg-tertiary);border:1px solid var(--color-border-primary);border-radius:var(--radius-md);padding:var(--spacing-lg);overflow-x:auto;margin:var(--spacing-lg) 0;box-shadow:var(--shadow-sm)}.doc-section[_ngcontent-%COMP%]   pre[_ngcontent-%COMP%]   code[_ngcontent-%COMP%]{font-family:var(--font-family-mono);font-size:var(--font-size-sm);color:var(--color-text-primary);line-height:var(--line-height-relaxed)}.doc-section[_ngcontent-%COMP%]   code[_ngcontent-%COMP%]{background:var(--color-bg-tertiary);padding:.2em .4em;border-radius:var(--radius-sm);font-size:var(--font-size-sm);font-family:var(--font-family-mono);color:var(--color-accent);border:1px solid var(--color-border-primary)}.doc-section[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{color:var(--color-accent);text-decoration:none;transition:color var(--transition-fast);font-weight:var(--font-weight-medium)}.doc-section[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover{color:var(--color-accent-hover);text-decoration:underline}.doc-section[_ngcontent-%COMP%]   .note[_ngcontent-%COMP%]{display:flex;align-items:flex-start;flex-direction:column;gap:var(--spacing-sm);padding:var(--spacing-lg);background:var(--color-bg-tertiary);border-left:4px solid var(--color-accent);border-radius:var(--radius-md);margin:var(--spacing-lg) 0}.doc-section[_ngcontent-%COMP%]   .note[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{display:flex;align-items:center;gap:var(--spacing-xs);color:var(--color-text-primary);font-weight:var(--font-weight-semibold)}.doc-section[_ngcontent-%COMP%]   .note[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]   .material-icons[_ngcontent-%COMP%]{font-size:var(--font-size-xl);color:var(--color-accent)}.doc-section[_ngcontent-%COMP%]   .note[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:0;color:var(--color-text-secondary)}.doc-section[_ngcontent-%COMP%]   .note-section[_ngcontent-%COMP%]   .note.info[_ngcontent-%COMP%]{border-left-color:var(--color-info-500)}.doc-section[_ngcontent-%COMP%]   .note-section[_ngcontent-%COMP%]   .note.info[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]   .material-icons[_ngcontent-%COMP%]{color:var(--color-info-500)}.doc-section[_ngcontent-%COMP%]   .note-section[_ngcontent-%COMP%]   .note.warning[_ngcontent-%COMP%]{border-left-color:var(--color-warning-500)}.doc-section[_ngcontent-%COMP%]   .note-section[_ngcontent-%COMP%]   .note.warning[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]   .material-icons[_ngcontent-%COMP%]{color:var(--color-warning-500)}.doc-section[_ngcontent-%COMP%]   .subsection[_ngcontent-%COMP%]{margin-bottom:var(--spacing-3xl)}.doc-section[_ngcontent-%COMP%]   .table-wrapper[_ngcontent-%COMP%]{overflow-x:auto;margin:var(--spacing-lg) 0;border-radius:var(--radius-md);box-shadow:var(--shadow-sm)}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]{width:100%;border-collapse:collapse;background:var(--color-bg-secondary);border:1px solid var(--color-border-primary);border-radius:var(--radius-md)}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   thead[_ngcontent-%COMP%]{background:var(--color-bg-tertiary)}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   thead[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   th[_ngcontent-%COMP%]{padding:var(--spacing-md) var(--spacing-lg);text-align:left;font-weight:var(--font-weight-semibold);color:var(--color-text-primary);border-bottom:2px solid var(--color-border-primary);font-size:var(--font-size-sm);text-transform:uppercase;letter-spacing:.05em}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]{border-bottom:1px solid var(--color-border-primary);transition:background var(--transition-fast)}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]:last-child{border-bottom:none}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]:hover{background:var(--color-bg-tertiary)}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]{padding:var(--spacing-md) var(--spacing-lg);color:var(--color-text-secondary);font-size:var(--font-size-base)}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]   code[_ngcontent-%COMP%]{background:var(--color-bg-tertiary);padding:.2em .4em;border-radius:var(--radius-sm);font-size:var(--font-size-sm);color:var(--color-accent);border:1px solid var(--color-border-primary)}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]   code[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{color:var(--color-accent);text-decoration:none}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]   code[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover{color:var(--color-accent-hover);text-decoration:underline}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]   strong[_ngcontent-%COMP%]{color:var(--color-text-primary);font-weight:var(--font-weight-semibold)}.doc-section[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]{list-style:disc;padding-left:var(--spacing-2xl);color:var(--color-text-secondary);margin:var(--spacing-lg) 0}.doc-section[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]{margin-bottom:var(--spacing-sm);line-height:var(--line-height-relaxed);font-size:var(--font-size-base)}.doc-section[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{color:var(--color-accent);font-weight:var(--font-weight-medium)}.doc-section[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover{color:var(--color-accent-hover)}.doc-section[_ngcontent-%COMP%]   ol[_ngcontent-%COMP%]{list-style:decimal;padding-left:var(--spacing-2xl);color:var(--color-text-secondary);margin:var(--spacing-lg) 0}.doc-section[_ngcontent-%COMP%]   ol[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]{margin-bottom:var(--spacing-sm);line-height:var(--line-height-relaxed);font-size:var(--font-size-base)}@media(max-width:768px){.doc-section[_ngcontent-%COMP%]{padding:var(--spacing-lg)}.doc-section[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:var(--font-size-2xl)}.doc-section[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%]{font-size:var(--font-size-xl)}.doc-section[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%]{font-size:var(--font-size-lg)}.doc-section[_ngcontent-%COMP%]   pre[_ngcontent-%COMP%]{padding:var(--spacing-md);font-size:var(--font-size-xs)}.doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   thead[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   th[_ngcontent-%COMP%], .doc-section[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]   tbody[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]{padding:var(--spacing-sm) var(--spacing-md);font-size:var(--font-size-sm)}}"]});let r=o;return r})();export{m as GettingStartedComponent};
