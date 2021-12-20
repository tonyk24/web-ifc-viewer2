import { Color, Vector2, WebGLRenderer } from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Context, IfcComponent } from '../../../base-types';
import { IfcPostproduction } from './postproduction';

export interface RendererAPI {
  domElement: HTMLElement;

  render(...args: any): void;

  setSize(width: number, height: number): void;
}

export class IfcRenderer extends IfcComponent {
  basicRenderer = new WebGLRenderer({ antialias: true });
  renderer2D = new CSS2DRenderer();
  postProductionRenderer: IfcPostproduction;
  renderer: RendererAPI = this.basicRenderer;

  postProductionActive = false;

  private readonly container: HTMLElement;
  private readonly context: Context;

  constructor(context: Context) {
    super(context);
    this.context = context;
    this.container = context.options.container;
    this.setupRenderers();
    this.postProductionRenderer = new IfcPostproduction(
      this.context,
      this.basicRenderer.domElement
    );
    this.adjustRendererSize();
  }

  get usePostproduction() {
    return this.postProductionActive;
  }

  set usePostproduction(active: boolean) {
    if (this.postProductionActive === active) return;
    this.postProductionActive = active;
    this.renderer = active ? this.postProductionRenderer : this.basicRenderer;
    if (!active) this.restoreRendererBackgroundColor();
  }

  update(_delta: number) {
    const scene = this.context.getScene();
    const camera = this.context.getCamera();
    this.renderer.render(scene, camera);
    this.renderer2D.render(scene, camera);
  }

  getSize() {
    return new Vector2(
      this.basicRenderer.domElement.clientWidth,
      this.basicRenderer.domElement.clientHeight
    );
  }

  adjustRendererSize() {
    this.basicRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer2D.setSize(this.container.clientWidth, this.container.clientHeight);
    this.postProductionRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  newScreenshot(usePostproduction = false, width?: number, height?: number) {
    const domElement = usePostproduction
      ? this.basicRenderer.domElement
      : this.postProductionRenderer.renderer.domElement;

    const previousWidth = domElement.width;
    const previousHeight = domElement.height;

    // this.context.updateAspect();

    const scene = this.context.getScene();
    const camera = this.context.getCamera();
    if (width && height) this.renderer.setSize(width, height);
    this.context.ifcCamera.updateAspect();
    this.renderer.render(scene, camera);
    const result = domElement.toDataURL();

    if (width && height) {
      this.renderer.setSize(previousWidth, previousHeight);
      this.context.ifcCamera.updateAspect();
    }

    return result;
  }

  private setupRenderers() {
    this.basicRenderer.localClippingEnabled = true;
    this.container.appendChild(this.basicRenderer.domElement);

    this.renderer2D.domElement.style.position = 'absolute';
    this.renderer2D.domElement.style.top = '0px';
    this.renderer2D.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.renderer2D.domElement);
  }

  private restoreRendererBackgroundColor() {
    this.basicRenderer.setClearColor(new Color(0, 0, 0), 0);
  }
}
