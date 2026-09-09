declare module '@babylonjs/core' {
  export class Engine {
    [key: string]: any;
    constructor(canvas: HTMLCanvasElement, antialias?: boolean, options?: any);
    runRenderLoop(renderFunction: () => void): void;
    resize(): void;
    dispose(): void;
  }

  export class Scene {
    [key: string]: any;
    clearColor: Color4;
    actionManager: ActionManager;
    constructor(engine: Engine);
    render(): void;
    dispose(): void;
  }

  export class Vector3 {
    [key: string]: any;
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number);
  }

  export class Color3 {
    [key: string]: any;
    r: number;
    g: number;
    b: number;
    constructor(r: number, g: number, b: number);
    static FromHexString(hex: string): Color3;
  }

  export class Color4 {
    [key: string]: any;
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r: number, g: number, b: number, a: number);
  }

  export class ArcRotateCamera {
    [key: string]: any;
    alpha: number;
    beta: number;
    radius: number;
    target: Vector3;
    lowerRadiusLimit: number;
    upperRadiusLimit: number;
    lowerBetaLimit: number;
    upperBetaLimit: number;
    wheelPrecision: number;
    pinchPrecision: number;
    constructor(
      name: string,
      alpha: number,
      beta: number,
      radius: number,
      target: Vector3,
      scene: Scene
    );
    attachControl(canvas: HTMLCanvasElement, noPreventDefault?: boolean): void;
  }

  export class HemisphericLight {
    [key: string]: any;
    intensity: number;
    diffuse: Color3;
    groundColor: Color3;
    constructor(name: string, direction: Vector3, scene: Scene);
  }

  export class DirectionalLight {
    [key: string]: any;
    intensity: number;
    position: Vector3;
    diffuse: Color3;
    constructor(name: string, direction: Vector3, scene: Scene);
  }

  export class StandardMaterial {
    [key: string]: any;
    diffuseColor: Color3;
    specularColor: Color3;
    emissiveColor: Color3;
    alpha: number;
    diffuseTexture: any;
    constructor(name: string, scene: Scene);
  }

  export class DynamicTexture {
    [key: string]: any;
    constructor(name: string, options: any, scene: Scene);
    getContext(): CanvasRenderingContext2D;
    update(): void;
  }

  export class Mesh {
    [key: string]: any;
    position: Vector3;
    rotation: Vector3;
    material: any;
    actionManager: ActionManager;
    setEnabled(enabled: boolean): void;
    dispose(): void;
  }

  export class MeshBuilder {
    static CreateCylinder(name: string, options: any, scene?: Scene): Mesh;
    static CreateSphere(name: string, options: any, scene?: Scene): Mesh;
    static CreateBox(name: string, options: any, scene?: Scene): Mesh;
    static CreateGround(name: string, options: any, scene?: Scene): Mesh;
    static CreateDisc(name: string, options: any, scene?: Scene): Mesh;
    static [key: string]: any;
  }

  export class ActionManager {
    [key: string]: any;
    static OnPickTrigger: number;
    constructor(scene: Scene);
    registerAction(action: any): any;
  }

  export class ExecuteCodeAction {
    [key: string]: any;
    constructor(triggerOptions: any, func: (evt?: any) => void);
  }
}

declare module '@babylonjs/loaders';
