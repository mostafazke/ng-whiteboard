import { BaseTool, TLBrushShapeType, TLPointerEventHandler } from "./base-tool"

enum Status {
  Idle = 'idle',
  Creating = 'creating',
}

export class RectangleTool extends BaseTool {
  type = TLBrushShapeType.Rectangle

  status = Status.Idle

  /* --------------------- Methods -------------------- */

  private setStatus(status: Status) {
    this.status = status
  }

  /* ----------------- Event Handlers ----------------- */

  override onPointerDown: TLPointerEventHandler = (info) => {
    // const pagePoint = Vec.round(this.state.getPagePoint(info.point))

    // const {
    //   appState: { currentPageId, currentStyle },
    // } = this.state

    // const childIndex = this.getNextChildIndex()

    // const id = Utils.uniqueId()

    // const newShape = Rectangle.create({
    //   id,
    //   parentId: currentPageId,
    //   childIndex,
    //   point: pagePoint,
    //   style: { ...currentStyle },
    // })

    // this.state.createShapes(newShape)

    // this.state.startSession(SessionType.Transform, pagePoint, TLBoundsCorner.BottomRight)

    this.setStatus(Status.Creating)
  }

  override onPointerMove: TLPointerEventHandler = (info) => {
    if (this.status === Status.Creating) {
      // const pagePoint = Vec.round(this.state.getPagePoint(info.point))
      // this.state.updateSession(pagePoint, info.shiftKey, info.altKey, info.metaKey)
    }
  }

  override onPointerUp: TLPointerEventHandler = () => {
    if (this.status === Status.Creating) {
      // this.state.completeSession()
    }

    this.setStatus(Status.Idle)
  }
}
