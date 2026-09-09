import {
  ActionManager,
  ArcRotateCamera,
  Color3,
  Color4,
  DynamicTexture,
  Engine,
  ExecuteCodeAction,
  HemisphericLight,
  DirectionalLight,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import '@babylonjs/loaders/glTF';
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js';
import { BoardState, GameState, HexTile, BoardVertex, BoardEdge } from '@hexara/game-core';
import { TERRAIN_COLORS } from '@hexara/shared';

const TERRAIN_TEXTURES: Record<string, string> = {
  hills: '/textures/hexes/brick.jpg',      // The red color block is associated with the brick image
  pasture: '/textures/hexes/wool.jpg',     // Pasture with sheep
  fields: '/textures/hexes/grain.jpg',     // Fields with wheat & windmill
  mountains: '/textures/hexes/ore.jpg',    // Mountains with ore & snow
  forest: '/textures/hexes/forest.png',    // Forest with dense trees
  desert: '/textures/hexes/desert.jpg',    // Desert with dunes & skulls
};

export interface BabylonCallbacks {
  onVertexClick?: (vertexId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onHexClick?: (hexId: string) => void;
}

export type CameraViewMode = 'perspective' | 'tactical';

export class BabylonGame {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private callbacks: BabylonCallbacks;

  // Meshes tracking
  private hexMeshes = new Map<string, Mesh>();
  private hexTopMeshes = new Map<string, Mesh>();
  private tokenMeshes = new Map<string, Mesh>();
  private vertexNodes = new Map<string, Mesh>();
  private edgeNodes = new Map<string, Mesh>();
  private roadArrowMeshes = new Map<string, Mesh>();
  private pieceMeshes = new Map<string, Mesh>();
  private harborMeshes: Mesh[] = [];
  private robberMesh: Mesh | null = null;
  private candleLight: HemisphericLight | null = null;

  // Materials caching
  private terrainMaterials = new Map<string, StandardMaterial>();
  private blockSideMaterial: StandardMaterial | null = null;
  private lastBoardHash = '';

  private currentCameraMode: CameraViewMode = 'perspective';

  constructor(canvas: HTMLCanvasElement, callbacks: BabylonCallbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      powerPreference: 'high-performance',
    });

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.05, 0.03, 0.02, 1.0); // Warm dark tavern ambient backdrop

    // Camera
    this.camera = new ArcRotateCamera(
      'mainCamera',
      -Math.PI / 2,
      Math.PI / 3.4,
      34,
      new Vector3(0, 0, 0),
      this.scene
    );
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerBetaLimit = 0.05;
    this.camera.upperBetaLimit = Math.PI / 2.3;
    this.camera.lowerRadiusLimit = 16;
    this.camera.upperRadiusLimit = 54;
    this.camera.wheelPrecision = 40;
    this.camera.pinchPrecision = 50;

    // Lighting: Tavern Ambience
    const ambientLight = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
    ambientLight.intensity = 0.7;
    ambientLight.diffuse = new Color3(1.0, 0.92, 0.85);
    ambientLight.groundColor = new Color3(0.2, 0.12, 0.08);

    const sunLight = new DirectionalLight('sun', new Vector3(-0.8, -1.8, -0.6), this.scene);
    sunLight.position = new Vector3(25, 45, 25);
    sunLight.intensity = 0.9;
    sunLight.diffuse = new Color3(1.0, 0.96, 0.9);

    // Build Tabletop Tavern Atmosphere & Props
    this.createTavernTabletop();
    this.createTabletopProps();

    // Preload GLB Grim Reaper Robber Model instantly without delay
    this.preloadRobberModel();

    // Render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    window.addEventListener('resize', this.handleResize);
    setTimeout(() => {
      this.engine.resize();
    }, 50);
    setTimeout(() => {
      this.engine.resize();
    }, 200);
  }

  private isRobberLoading = false;
  private targetRobberPos = new Vector3(0, 0.68, 0);
  private robberYBaseOffset = 0;

  /**
   * Preloads the authentic Grim Reaper 3D model (grim_reaper_with_golden_angel_dark_wings.glb)
   * so it loads instantly with zero lag or delay, oriented at a golden perspective angle.
   */
  private preloadRobberModel(): void {
    if (this.robberMesh || this.isRobberLoading) return;
    this.isRobberLoading = true;

    SceneLoader.ImportMeshAsync('', '/models/', 'robber.glb', this.scene as any)
      .then((result: any) => {
        const root = MeshBuilder.CreateBox('robber_root', { size: 0.01 }, this.scene as any);
        root.visibility = 0;
        result.meshes.forEach((m: any) => {
          if (!m.parent) {
            m.parent = root;
          }
        });

        // Play any embedded idle/wing animations
        if (result.animationGroups && result.animationGroups.length > 0) {
          result.animationGroups.forEach((ag: any) => ag.play(true));
        }

        // Compute bounding box and normalize scale to fit tile height nicely
        const bounds = root.getHierarchyBoundingVectors();
        const sizeY = bounds.max.y - bounds.min.y;
        const scaleFactor = sizeY > 0 ? 2.8 / sizeY : 1.0;
        root.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);

        // Golden aesthetic angle looking diagonally toward the camera/board
        root.rotation.y = Math.PI * 0.25; // 45° golden perspective angle
        this.robberYBaseOffset = bounds.min.y * scaleFactor;
        root.position = new Vector3(
          this.targetRobberPos.x,
          this.targetRobberPos.y - this.robberYBaseOffset,
          this.targetRobberPos.z
        );

        this.robberMesh = root;
        this.isRobberLoading = false;
      })
      .catch((err: any) => {
        console.warn('Failed to load robber.glb, using fallback model:', err);
        if (!this.robberMesh) {
          const fallback = MeshBuilder.CreateCylinder(
            'robber_fallback',
            { diameterTop: 0.65, diameterBottom: 1.2, height: 1.9, tessellation: 20 },
            this.scene as any
          );
          fallback.position = this.targetRobberPos.clone();
          const rMat = new StandardMaterial('rFallbackMat', this.scene as any);
          rMat.diffuseColor = new Color3(0.12, 0.12, 0.14);
          rMat.specularColor = new Color3(0.8, 0.7, 0.3);
          fallback.material = rMat;
          this.robberMesh = fallback;
        }
        this.isRobberLoading = false;
      });
  }

  private updateRobberPosition(x: number, z: number): void {
    this.targetRobberPos = new Vector3(x, 0.68, z);
    if (this.robberMesh) {
      this.robberMesh.position = new Vector3(x, 0.68 - this.robberYBaseOffset, z);
    }
  }

  private handleResize = () => {
    this.engine.resize();
  };

  /**
   * Creates the polished wooden tavern tabletop beneath the archipelago board
   * with the realistic rich walnut/oak wood grain texture.
   */
  private createTavernTabletop(): void {
    // 1. Massive Polished Dark Walnut Tavern Table Slab
    const table = MeshBuilder.CreateBox(
      'tavernTable',
      { width: 100, height: 1.8, depth: 85 },
      this.scene
    );
    table.position = new Vector3(0, -1.0, 0);

    const tableMat = new StandardMaterial('tableMat', this.scene);
    const tableTex = new Texture('/textures/table/wood_table.jpg', this.scene as any);
    tableTex.uScale = 2.5;
    tableTex.vScale = 2.0;
    tableTex.anisotropicFilteringLevel = 16;
    tableTex.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);

    tableMat.diffuseTexture = tableTex;
    tableMat.ambientColor = new Color3(1, 1, 1);
    tableMat.specularColor = new Color3(0.35, 0.25, 0.16); // Warm lacquer sheen
    tableMat.specularPower = 32;
    table.material = tableMat;

    // 2. Circular Polished Wooden Board Base Frame beneath the archipelago
    const boardBase = MeshBuilder.CreateCylinder(
      'boardBaseRing',
      { diameter: 38, height: 0.25, tessellation: 64 },
      this.scene
    );
    boardBase.position = new Vector3(0, -0.2, 0);

    const baseMat = new StandardMaterial('boardBaseMat', this.scene);
    const baseTex = new Texture('/textures/table/wood_board.jpg', this.scene as any);
    baseTex.uScale = 1.5;
    baseTex.vScale = 1.5;
    baseTex.anisotropicFilteringLevel = 16;
    baseTex.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);

    baseMat.diffuseTexture = baseTex;
    baseMat.ambientColor = new Color3(1, 1, 1);
    baseMat.specularColor = new Color3(0.3, 0.2, 0.1);
    baseMat.specularPower = 40;
    boardBase.material = baseMat;
  }

  /**
   * Creates decorative tabletop props matching the reference image:
   * 1. Brass/Iron Lantern with warm flickering flame (Top-Left)
   * 2. Antique Nautical Map & Chart Sheets (Left)
   * 3. Felt-Lined Wooden Dice Box with pair of 3D Dice (Bottom-Left)
   * 4. Stacked Resource Card Decks (Top-Right)
   * 5. Gold-Embossed Leather-Bound "CATAN" Almanac Book (Right)
   * 6. Turned Wooden Shaker Tumbler Cup (Bottom-Right)
   */
  private createTabletopProps(): void {
    // --- 1. Brass & Iron Lantern with Warm Amber Flame (Top-Left) ---
    const lanternBase = MeshBuilder.CreateCylinder(
      'lanternBase',
      { diameter: 2.8, height: 0.5, tessellation: 24 },
      this.scene
    );
    lanternBase.position = new Vector3(-18.5, -0.1, 13.5);
    const ironMat = new StandardMaterial('ironMat', this.scene);
    ironMat.diffuseColor = new Color3(0.12, 0.12, 0.14);
    ironMat.specularColor = new Color3(0.6, 0.5, 0.2);
    lanternBase.material = ironMat;

    // Lantern Glass Cylinder
    const lanternGlass = MeshBuilder.CreateCylinder(
      'lanternGlass',
      { diameter: 2.2, height: 3.2, tessellation: 20 },
      this.scene
    );
    lanternGlass.position = new Vector3(-18.5, 1.7, 13.5);
    const glassMat = new StandardMaterial('glassMat', this.scene);
    glassMat.diffuseColor = new Color3(1.0, 0.8, 0.4);
    glassMat.emissiveColor = new Color3(0.6, 0.35, 0.1);
    glassMat.alpha = 0.55;
    lanternGlass.material = glassMat;

    // Glowing Candle Flame inside Lantern
    const lanternFlame = MeshBuilder.CreateSphere(
      'lanternFlame',
      { diameter: 0.7, segments: 12 },
      this.scene
    );
    lanternFlame.position = new Vector3(-18.5, 1.4, 13.5);
    const flameMat = new StandardMaterial('flameMat', this.scene);
    flameMat.emissiveColor = new Color3(1.0, 0.75, 0.2);
    lanternFlame.material = flameMat;

    // --- Rustic 3-Candle Dish with Molten Wax (Matching Reference Images 4, 9, 10, 11) ---
    const candleDish = MeshBuilder.CreateCylinder(
      'candleDish',
      { diameter: 4.6, height: 0.35, tessellation: 32 },
      this.scene
    );
    candleDish.position = new Vector3(-13.5, 0.0, 13.8);
    const dishMat = new StandardMaterial('dishMat', this.scene);
    dishMat.diffuseColor = new Color3(0.18, 0.14, 0.12);
    dishMat.specularColor = new Color3(0.4, 0.3, 0.2);
    candleDish.material = dishMat;

    const waxMat = new StandardMaterial('waxMat', this.scene);
    waxMat.diffuseColor = new Color3(0.95, 0.9, 0.78);
    waxMat.specularColor = new Color3(0.2, 0.2, 0.15);

    const candleFlameMat = new StandardMaterial('candleFlameMat', this.scene);
    candleFlameMat.emissiveColor = new Color3(1.0, 0.8, 0.25);
    candleFlameMat.diffuseColor = new Color3(1.0, 0.9, 0.4);

    const candleSpecs = [
      { x: -13.5, z: 13.8, h: 2.2, r: 0.7 },
      { x: -14.4, z: 13.1, h: 1.5, r: 0.55 },
      { x: -12.7, z: 13.2, h: 1.8, r: 0.6 },
    ];

    candleSpecs.forEach((c, idx) => {
      const wax = MeshBuilder.CreateCylinder(
        `candleWax_${idx}`,
        { diameter: c.r * 2, height: c.h, tessellation: 20 },
        this.scene
      );
      wax.position = new Vector3(c.x, c.h / 2 + 0.15, c.z);
      wax.material = waxMat;

      const flame = MeshBuilder.CreateSphere(
        `candleFlame_${idx}`,
        { diameterX: 0.35, diameterY: 0.55, diameterZ: 0.35, segments: 10 },
        this.scene
      );
      flame.position = new Vector3(c.x, c.h + 0.35, c.z);
      flame.material = candleFlameMat;
    });

    // Warm Ambient Candle Glow Light
    this.candleLight = new HemisphericLight('candleGlow', new Vector3(-0.8, 1, 0.6), this.scene);
    this.candleLight.diffuse = new Color3(1.0, 0.8, 0.45);
    this.candleLight.groundColor = new Color3(0.2, 0.1, 0.05);
    this.candleLight.intensity = 0.55;

    // --- 2. Antique Nautical Map & Chart Sheets on Table (Left) ---
    const mapSheet = MeshBuilder.CreateBox(
      'nauticalMap',
      { width: 6.5, height: 0.04, depth: 9.5 },
      this.scene
    );
    mapSheet.position = new Vector3(-18.5, -0.08, 1.5);
    mapSheet.rotation.y = 0.15;

    const mapTex = new DynamicTexture('mapTex', { width: 512, height: 512 }, this.scene);
    const mCtx = mapTex.getContext() as CanvasRenderingContext2D;
    mCtx.fillStyle = '#edd6af'; // aged parchment
    mCtx.fillRect(0, 0, 512, 512);
    mCtx.strokeStyle = '#78350f';
    mCtx.lineWidth = 8;
    mCtx.strokeRect(10, 10, 492, 492);
    mCtx.fillStyle = '#451a03';
    mCtx.font = 'bold 32px serif';
    mCtx.textAlign = 'center';
    mCtx.fillText('ISLES OF HEXARA', 256, 65);
    mCtx.font = 'italic 20px serif';
    mCtx.fillText('Navigational Chart & Coastlines', 256, 105);
    // Compass rose drawing on map
    mCtx.beginPath();
    mCtx.arc(256, 280, 80, 0, Math.PI * 2);
    mCtx.strokeStyle = '#92400e';
    mCtx.lineWidth = 4;
    mCtx.stroke();
    mCtx.fillStyle = '#92400e';
    mCtx.font = 'bold 24px serif';
    mCtx.fillText('N', 256, 190);
    mCtx.fillText('S', 256, 385);
    mCtx.fillText('W', 160, 285);
    mCtx.fillText('E', 350, 285);
    mapTex.update();

    const mapMat = new StandardMaterial('mapMat', this.scene);
    mapMat.diffuseTexture = mapTex;
    mapSheet.material = mapMat;

    // --- 3. Wooden Felt-Lined Dice Box with 2 White Dice (Bottom-Left) ---
    const diceBox = MeshBuilder.CreateBox(
      'diceBox',
      { width: 5.5, height: 0.9, depth: 5.5 },
      this.scene
    );
    diceBox.position = new Vector3(-16.0, 0.25, -13.5);
    diceBox.rotation.y = 0.35;
    const boxMat = new StandardMaterial('boxMat', this.scene);
    boxMat.diffuseColor = new Color3(0.25, 0.14, 0.08); // Dark wood box
    diceBox.material = boxMat;

    // Felt lining inside dice box
    const felt = MeshBuilder.CreateBox(
      'diceBoxFelt',
      { width: 4.8, height: 0.1, depth: 4.8 },
      this.scene
    );
    felt.position = new Vector3(-16.0, 0.65, -13.5);
    felt.rotation.y = 0.35;
    const feltMat = new StandardMaterial('feltMat', this.scene);
    feltMat.diffuseColor = new Color3(0.12, 0.25, 0.15); // Emerald green felt
    felt.material = feltMat;

    // 2 White 3D Dice inside Dice Box
    const die1 = MeshBuilder.CreateBox('trayDie1', { size: 1.1 }, this.scene);
    die1.position = new Vector3(-16.8, 1.1, -13.8);
    die1.rotation.y = 0.45;
    const die2 = MeshBuilder.CreateBox('trayDie2', { size: 1.1 }, this.scene);
    die2.position = new Vector3(-15.2, 1.1, -13.1);
    die2.rotation.y = -0.25;

    const diceMat = new StandardMaterial('trayDiceMat', this.scene);
    diceMat.diffuseColor = new Color3(0.98, 0.97, 0.95);
    diceMat.specularColor = new Color3(0.2, 0.2, 0.2);
    die1.material = diceMat;
    die2.material = diceMat;

    // --- 4. Stacked Resource Card Decks (Top-Right) ---
    for (let d = 0; d < 3; d++) {
      const deck = MeshBuilder.CreateBox(
        `cardDeck_${d}`,
        { width: 3.2, height: 0.7, depth: 4.5 },
        this.scene
      );
      deck.position = new Vector3(16.5 + d * 1.0, 0.2 + d * 0.1, 13.5 - d * 1.5);
      deck.rotation.y = -0.3 + d * 0.2;

      const deckTex = new DynamicTexture(`deckTex_${d}`, { width: 256, height: 256 }, this.scene);
      const dCtx = deckTex.getContext() as CanvasRenderingContext2D;
      dCtx.fillStyle = '#1e3a1e';
      dCtx.fillRect(0, 0, 256, 256);
      dCtx.strokeStyle = '#d4af37';
      dCtx.lineWidth = 10;
      dCtx.strokeRect(8, 8, 240, 240);
      dCtx.fillStyle = '#ffffff';
      dCtx.font = '60px sans-serif';
      dCtx.textAlign = 'center';
      dCtx.fillText('🌲', 128, 140);
      deckTex.update();

      const dMat = new StandardMaterial(`deckMat_${d}`, this.scene);
      dMat.diffuseTexture = deckTex;
      deck.material = dMat;
    }

    // --- 5. Gold-Embossed Leather "CATAN" Book / Rulebook (Right) ---
    const book = MeshBuilder.CreateBox(
      'catanBook',
      { width: 6.8, height: 1.2, depth: 9.8 },
      this.scene
    );
    book.position = new Vector3(17.5, 0.4, -4.5);
    book.rotation.y = -0.18;

    const bookTex = new DynamicTexture('bookTex', { width: 512, height: 512 }, this.scene);
    const bCtx = bookTex.getContext() as CanvasRenderingContext2D;
    bCtx.fillStyle = '#3f1f10'; // Rich Leather Brown
    bCtx.fillRect(0, 0, 512, 512);
    bCtx.strokeStyle = '#d4af37'; // Gold foil embossing
    bCtx.lineWidth = 14;
    bCtx.strokeRect(16, 16, 480, 480);
    bCtx.strokeStyle = '#b45309';
    bCtx.lineWidth = 4;
    bCtx.strokeRect(30, 30, 452, 452);

    bCtx.fillStyle = '#fef08a';
    bCtx.font = 'bold 58px serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('CATAN', 256, 130);

    // Embossed gold compass star
    bCtx.font = 'bold 120px serif';
    bCtx.fillText('🧭', 256, 300);

    bCtx.font = 'bold 22px sans-serif';
    bCtx.fillText('ALMANAC & TRADE RULES', 256, 420);
    bookTex.update();

    const bookMat = new StandardMaterial('bookMat', this.scene);
    bookMat.diffuseTexture = bookTex;
    bookMat.specularColor = new Color3(0.4, 0.3, 0.1);
    bookMat.specularPower = 32;
    book.material = bookMat;

    // --- 6. Turned Wooden Shaker Tumbler Cup (Bottom-Right) ---
    const tumbler = MeshBuilder.CreateCylinder(
      'woodTumbler',
      { diameterTop: 2.6, diameterBottom: 1.8, height: 3.2, tessellation: 24 },
      this.scene
    );
    tumbler.position = new Vector3(17.0, 1.2, -14.0);
    const tumblerMat = new StandardMaterial('tumblerMat', this.scene);
    tumblerMat.diffuseColor = new Color3(0.4, 0.22, 0.12);
    tumbler.material = tumblerMat;

    // --- 7. Building Costs Reference Cards & Supply Stacks at Each Player's Table Station ---
    this.createPlayerTableStations();
  }

  /**
   * Generates the 18 surrounding hexagonal water frame tiles (Axial distance = 3 ring)
   * forming the interlocking blue ocean frame with wave textures and coastal sandy borders.
   */
  private renderWaterFrameHexes(): void {
    if (this.harborMeshes.length > 0) return;

    // The 18 axial coordinates (q, r) at ring radius = 3
    const WATER_COORDS = [
      { q: 3, r: 0, harbor: { text: '3:1', icon: '❓', label: '3:1' } },
      { q: 3, r: -1, harbor: null },
      { q: 3, r: -2, harbor: { text: '2:1', icon: '🌾', label: 'Grain' } },
      { q: 3, r: -3, harbor: null },
      { q: 2, r: -3, harbor: { text: '2:1', icon: '🪵', label: 'Lumber' } },
      { q: 1, r: -3, harbor: null },
      { q: 0, r: -3, harbor: { text: '3:1', icon: '❓', label: '3:1' } },
      { q: -1, r: -2, harbor: null },
      { q: -2, r: -1, harbor: { text: '2:1', icon: '🧱', label: 'Brick' } },
      { q: -3, r: 0, harbor: null },
      { q: -3, r: 1, harbor: { text: '3:1', icon: '❓', label: '3:1' } },
      { q: -3, r: 2, harbor: null },
      { q: -3, r: 3, harbor: { text: '2:1', icon: '🐑', label: 'Wool' } },
      { q: -2, r: 3, harbor: null },
      { q: -1, r: 3, harbor: { text: '3:1', icon: '❓', label: '3:1' } },
      { q: 0, r: 3, harbor: null },
      { q: 1, r: 2, harbor: { text: '2:1', icon: '⛰️', label: 'Ore' } },
      { q: 2, r: 1, harbor: null },
    ];

    // Shared vibrant blue ocean water material
    const waterMat = new StandardMaterial('oceanHexMat', this.scene);
    waterMat.diffuseColor = new Color3(0.08, 0.45, 0.88); // Azure Caribbean Blue
    waterMat.specularColor = new Color3(0.4, 0.7, 0.95);
    waterMat.specularPower = 64;

    const R = 2.0; // Hex radius

    WATER_COORDS.forEach((coord, idx) => {
      const x = R * Math.sqrt(3) * (coord.q + coord.r / 2);
      const z = R * 1.5 * coord.r;

      // 1. Water Hexagon Prism Block (height 0.45)
      const waterHex = MeshBuilder.CreateCylinder(
        `waterHex_${idx}`,
        { diameter: 3.96, height: 0.45, tessellation: 6 },
        this.scene
      );
      waterHex.position = new Vector3(x, 0.225, z);
      waterHex.rotation.y = Math.PI / 6;
      waterHex.material = waterMat;

      this.harborMeshes.push(waterHex);

      // 2. Coastal Harbor Medallion Token (on designated port hexes)
      if (coord.harbor) {
        const harborDisc = MeshBuilder.CreateCylinder(
          `harborDisc_${idx}`,
          { diameter: 1.45, height: 0.12, tessellation: 28 },
          this.scene
        );
        // Position on top of water hex
        harborDisc.position = new Vector3(x, 0.48, z);

        const hDyn = new DynamicTexture(`hDyn_${idx}`, { width: 256, height: 256 }, this.scene);
        const hCtx = hDyn.getContext() as CanvasRenderingContext2D;
        hCtx.fillStyle = '#fef3c7'; // Ivory Parchment
        hCtx.beginPath();
        hCtx.arc(128, 128, 118, 0, Math.PI * 2);
        hCtx.fill();
        hCtx.lineWidth = 10;
        hCtx.strokeStyle = '#92400e';
        hCtx.stroke();

        // Icon or Question Mark
        if (coord.harbor.icon === '❓') {
          hCtx.fillStyle = '#1e293b';
          hCtx.font = 'bold 120px serif';
          hCtx.textAlign = 'center';
          hCtx.textBaseline = 'middle';
          hCtx.fillText('?', 128, 128);
        } else {
          hCtx.font = '100px sans-serif';
          hCtx.textAlign = 'center';
          hCtx.textBaseline = 'middle';
          hCtx.fillText(coord.harbor.icon, 128, 128);
        }

        hDyn.update();

        const hMat = new StandardMaterial(`hMat_${idx}`, this.scene);
        hMat.diffuseTexture = hDyn;
        hMat.specularColor = new Color3(0.1, 0.1, 0.1);
        harborDisc.material = hMat;

        this.harborMeshes.push(harborDisc);
      }
    });
  }

  /**
   * Applies material to a piece and all its composite submeshes (walls, roofs, towers).
   */
  private applyPieceMaterial(piece: Mesh, material: StandardMaterial): void {
    piece.material = material;
    piece.getChildMeshes().forEach((m: any) => {
      m.material = material;
    });
  }

  /**
   * Builds an authentic Catan wooden Settlement piece (as shown in reference image):
   * A rectangular house base topped with a peaked gable roof.
   */
  private createSettlementMesh(name: string, scale: number = 1.0): Mesh {
    const w = 0.68 * scale;
    const hBase = 0.44 * scale;
    const d = 0.68 * scale;

    const base = MeshBuilder.CreateBox(name, { width: w, height: hBase, depth: d }, this.scene);
    base.position.y = hBase / 2;

    // Peaked gable roof: triangular prism
    const roof = MeshBuilder.CreateCylinder(
      `${name}_r`,
      { diameter: w * 1.1547, height: d, tessellation: 3 },
      this.scene
    );
    roof.rotation.x = Math.PI / 2;
    roof.rotation.z = Math.PI / 2;
    roof.position.y = hBase / 2 + (w * 1.1547 / 2) * 0.5;
    roof.parent = base;

    return base;
  }

  /**
   * Builds an authentic Catan wooden City piece (as shown in reference image):
   * A low wing house base on the left attached to a taller cathedral tower with a peaked gable roof on the right.
   */
  private createCityMesh(name: string, scale: number = 1.0): Mesh {
    const wWing = 0.46 * scale;
    const hWing = 0.52 * scale;
    const d = 0.68 * scale;

    const wTower = 0.46 * scale;
    const hTower = 0.84 * scale;

    // Cathedral tower body (main root)
    const tower = MeshBuilder.CreateBox(name, { width: wTower, height: hTower, depth: d }, this.scene);
    tower.position.y = hTower / 2;

    // Lower wing house (left step)
    const wing = MeshBuilder.CreateBox(`${name}_w`, { width: wWing, height: hWing, depth: d }, this.scene);
    wing.position.x = -wWing;
    wing.position.y = (hWing - hTower) / 2;
    wing.parent = tower;

    // Peaked gable roof atop the tower
    const roof = MeshBuilder.CreateCylinder(
      `${name}_r`,
      { diameter: wTower * 1.1547, height: d, tessellation: 3 },
      this.scene
    );
    roof.rotation.x = Math.PI / 2;
    roof.rotation.z = Math.PI / 2;
    roof.position.y = hTower / 2 + (wTower * 1.1547 / 2) * 0.5;
    roof.parent = tower;

    return tower;
  }

  /**
   * Creates 4 player stations placed ON TOP of the circular table surface (y = 0.02, r ~ 13.5)
   * with rotated high-definition cards and authentic wooden settlement and city piece racks.
   */
  private createPlayerTableStations(): void {
    const stations = [
      {
        id: 'red',
        name: 'Red Player (Silver)',
        color: '#dc2626',
        pos: new Vector3(-3.5, 0.02, -13.8),
        rotY: 0.0,
        texPath: '/textures/cards/building_costs_red.jpg',
      },
      {
        id: 'blue',
        name: 'Blue Player (Drake)',
        color: '#2563eb',
        pos: new Vector3(-14.2, 0.02, 1.5),
        rotY: Math.PI / 2.0,
        texPath: '/textures/cards/building_costs_blue.jpg',
      },
      {
        id: 'yellow',
        name: 'Yellow Player (Amber)',
        color: '#d97706',
        pos: new Vector3(3.5, 0.02, 14.0),
        rotY: Math.PI,
        texPath: '/textures/cards/building_costs_yellow.jpg',
      },
      {
        id: 'green',
        name: 'Green Player (Anne)',
        color: '#059669',
        pos: new Vector3(14.2, 0.02, -1.5),
        rotY: -Math.PI / 2.0,
        texPath: '/textures/cards/building_costs_green.jpg',
      },
    ];

    stations.forEach((st) => {
      // 1. High-Resolution Building Costs Reference Card resting on table
      const card = MeshBuilder.CreateBox(
        `building_card_${st.id}`,
        { width: 4.2, height: 0.03, depth: 5.4 },
        this.scene
      );
      card.position = st.pos;
      card.rotation.y = st.rotY;

      const cardMat = new StandardMaterial(`cardMat_${st.id}`, this.scene);
      const tex = new Texture(st.texPath, this.scene as any);
      tex.anisotropicFilteringLevel = 16;
      tex.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);

      cardMat.diffuseTexture = tex;
      cardMat.ambientColor = new Color3(1, 1, 1);
      cardMat.specularColor = new Color3(0.04, 0.04, 0.04);
      cardMat.specularPower = 128;
      card.material = cardMat;

      // 2. Wooden Piece Supply Rack sitting beside each player's card
      const pieceMat = new StandardMaterial(`supplyMat_${st.id}`, this.scene);
      pieceMat.diffuseColor = Color3.FromHexString(st.color);
      pieceMat.specularColor = new Color3(0.2, 0.2, 0.2);

      // Local orientation vectors for piece placement beside the card
      const cosA = Math.cos(st.rotY);
      const sinA = Math.sin(st.rotY);

      const toWorld = (lx: number, lz: number, yOffset: number): Vector3 => {
        const wx = st.pos.x + (lx * cosA + lz * sinA);
        const wz = st.pos.z + (-lx * sinA + lz * cosA);
        return new Vector3(wx, st.pos.y + yOffset, wz);
      };

      // A) 15 Road Sticks (arranged neatly in 3 rows of 5)
      for (let r = 0; r < 15; r++) {
        const row = Math.floor(r / 5);
        const col = r % 5;
        const road = MeshBuilder.CreateBox(
          `supply_road_${st.id}_${r}`,
          { width: 0.18, height: 0.16, depth: 0.9 },
          this.scene
        );
        road.position = toWorld(2.6 + row * 0.35, -1.6 + col * 0.8, 0.09);
        road.rotation.y = st.rotY;
        road.material = pieceMat;
      }

      // B) 5 Authentic Settlement Houses (peaked gable roof)
      for (let s = 0; s < 5; s++) {
        const settle = this.createSettlementMesh(`supply_settle_${st.id}_${s}`, 0.65);
        settle.position = toWorld(3.9, -1.5 + s * 0.75, 0.02);
        settle.rotation.y = st.rotY;
        this.applyPieceMaterial(settle, pieceMat);
      }

      // C) 4 Authentic Fortified Cities (stepped cathedral tower)
      for (let c = 0; c < 4; c++) {
        const city = this.createCityMesh(`supply_city_${st.id}_${c}`, 0.75);
        city.position = toWorld(4.8, -1.2 + c * 0.85, 0.02);
        city.rotation.y = st.rotY;
        this.applyPieceMaterial(city, pieceMat);
      }
    });
  }



  private getTerrainMaterial(terrain: string): StandardMaterial {
    let mat = this.terrainMaterials.get(terrain);
    if (!mat) {
      mat = new StandardMaterial(`mat_terrain_${terrain}`, this.scene);
      const texPath = TERRAIN_TEXTURES[terrain];
      if (texPath) {
        const tex = new Texture(texPath, this.scene as any);
        // Enable maximum anisotropic filtering for ultra-crisp, sharp terrain images at all angles
        tex.anisotropicFilteringLevel = 16;
        tex.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
        // Ensure UV rotation center is exact center
        tex.uRotationCenter = 0.5;
        tex.vRotationCenter = 0.5;
        if (terrain === 'desert') {
          // Desert hex in image is pointy-topped: align perfectly with pointy-topped 3D mesh block
          tex.wAng = -Math.PI / 6;
        } else {
          // Align flat-topped texture hexagon vertices directly with the pointy-topped 3D mesh block (zero tilt)
          tex.wAng = Math.PI / 3;
        }
        mat.diffuseTexture = tex;
        // Remove ambient/specular washout so terrain artwork shines with full vibrant richness
        mat.ambientColor = new Color3(1, 1, 1);
        mat.specularColor = new Color3(0.04, 0.04, 0.04);
        mat.specularPower = 128;
      } else {
        const hexHexColor = TERRAIN_COLORS[terrain as keyof typeof TERRAIN_COLORS] || '#666666';
        mat.diffuseColor = Color3.FromHexString(hexHexColor);
        mat.specularColor = new Color3(0.1, 0.1, 0.1);
      }
      mat.backFaceCulling = true;
      this.terrainMaterials.set(terrain, mat);
    }
    return mat;
  }

  private getBlockSideMaterial(): StandardMaterial {
    if (!this.blockSideMaterial) {
      this.blockSideMaterial = new StandardMaterial('blockSideMat', this.scene);
      this.blockSideMaterial.diffuseColor = Color3.FromHexString('#be8e52'); // Warm golden sandstone bevel matching image borders
      this.blockSideMaterial.specularColor = new Color3(0.25, 0.2, 0.15);
      this.blockSideMaterial.specularPower = 24;
    }
    return this.blockSideMaterial;
  }

  /**
   * Creates a thin flat hexagonal top-cap cylinder for the terrain texture face.
   * Using a cylinder (not a disc) gives us a proper UV-mapped top face with no z-fighting
   * against the main block, and the terrain image is fully visible from above.
   */
  private createHexTopMesh(name: string, radius: number): Mesh {
    // A very thin cylinder (height 0.02) with tessellation 6 = hexagonal prism cap
    // The top face gets the terrain texture; faces match the block exactly
    const cap = MeshBuilder.CreateCylinder(
      name,
      {
        diameter: radius * 2,
        height: 0.02,
        tessellation: 6,
      },
      this.scene
    );
    // Rotate 30° so flat-side faces align with the base block
    cap.rotation.y = Math.PI / 6;
    return cap;
  }

  public clearBoard(): void {
    this.hexMeshes.forEach((mesh) => mesh.dispose());
    this.hexMeshes.clear();

    this.hexTopMeshes.forEach((mesh) => mesh.dispose());
    this.hexTopMeshes.clear();

    this.tokenMeshes.forEach((mesh) => mesh.dispose());
    this.tokenMeshes.clear();

    this.vertexNodes.forEach((mesh) => mesh.dispose());
    this.vertexNodes.clear();

    this.edgeNodes.forEach((mesh) => mesh.dispose());
    this.edgeNodes.clear();

    this.roadArrowMeshes.forEach((mesh) => mesh.dispose());
    this.roadArrowMeshes.clear();

    this.harborMeshes.forEach((mesh) => mesh.dispose());
    this.harborMeshes = [];

    this.pieceMeshes.forEach((mesh) => mesh.dispose());
    this.pieceMeshes.clear();



    this.lastBoardHash = '';
  }

  public renderBoard(board: BoardState): void {
    // Check if board layout or seed has changed (e.g. shuffled new game)
    const currentHash = Object.values(board.hexes)
      .map((h) => `${h.id}:${h.terrain}:${h.diceNumber}`)
      .join('|');

    if (this.lastBoardHash !== '' && this.lastBoardHash !== currentHash) {
      this.clearBoard();
    }
    this.lastBoardHash = currentHash;

    // 1. Render 18 Surrounding Hexagonal Water Frame Ring with Coastal Harbors
    this.renderWaterFrameHexes();

    // 2. Render Each Hex as an Individual 3D Block with Textured Top
    for (const hex of Object.values(board.hexes) as HexTile[]) {
      if (this.hexMeshes.has(hex.id)) continue;

      // 1) Base 3D Hexagonal Block (individual block piece) — sides only, no top texture
      const hexBlock = MeshBuilder.CreateCylinder(
        `block_${hex.id}`,
        {
          diameter: 3.96,
          height: 0.65,
          tessellation: 6,
        },
        this.scene
      );
      hexBlock.position = new Vector3(hex.x, 0.325, hex.z);
      hexBlock.rotation.y = Math.PI / 6;
      hexBlock.material = this.getBlockSideMaterial();

      // 2) Individual Hex Top Face Cap — sits exactly on top of block at y=0.66
      const hexTop = this.createHexTopMesh(`top_${hex.id}`, 1.97);
      hexTop.position = new Vector3(hex.x, 0.66, hex.z);
      hexTop.material = this.getTerrainMaterial(hex.terrain);

      // Register click action on both block and top
      const onPick = () => {
        this.callbacks.onHexClick?.(hex.id);
      };
      hexBlock.actionManager = new ActionManager(this.scene);
      hexBlock.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, onPick));

      hexTop.actionManager = new ActionManager(this.scene);
      hexTop.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, onPick));

      this.hexMeshes.set(hex.id, hexBlock);
      this.hexTopMeshes.set(hex.id, hexTop);

      // 3) Number Token on top of the block — raised well above terrain face
      if (hex.diceNumber !== null) {
        this.createNumberToken(hex.id, hex.x, hex.z, hex.diceNumber, hex.pips);
      }
    }

    // 3. Render Vertex Anchors for Interactive Building (Flat glowing discs, hidden by default)
    for (const v of Object.values(board.vertices) as BoardVertex[]) {
      if (!this.vertexNodes.has(v.id)) {
        const vNode = MeshBuilder.CreateCylinder(
          `node_${v.id}`,
          { diameter: 0.52, height: 0.04, tessellation: 20 },
          this.scene
        );
        vNode.position = new Vector3(v.x, 0.68, v.z);

        const vMat = new StandardMaterial(`vMat_${v.id}`, this.scene);
        vMat.diffuseColor = new Color3(1.0, 0.85, 0.2);
        vMat.emissiveColor = new Color3(0.6, 0.45, 0.1);
        vMat.alpha = 0.85;
        vNode.material = vMat;
        vNode.setEnabled(false); // Hidden during normal gameplay to keep board pristine

        vNode.actionManager = new ActionManager(this.scene);
        vNode.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            this.callbacks.onVertexClick?.(v.id);
          })
        );

        this.vertexNodes.set(v.id, vNode);
      }
    }

    // 4. Render Edge Anchors and Road Direction Arrows (Flat placement guides, hidden by default)
    for (const edge of Object.values(board.edges) as BoardEdge[]) {
      if (!this.edgeNodes.has(edge.id)) {
        const [v1Id, v2Id] = edge.vertexIds;
        const v1 = board.vertices[v1Id];
        const v2 = board.vertices[v2Id];
        if (!v1 || !v2) continue;

        const dx = v2.x - v1.x;
        const dz = v2.z - v1.z;
        const angleY = Math.atan2(dx, dz);

        // Clickable Edge Box — subtle flat placement zone
        const edgeAnchor = MeshBuilder.CreateBox(
          `edge_${edge.id}`,
          { width: 0.35, height: 0.06, depth: 1.6 },
          this.scene
        );
        edgeAnchor.position = new Vector3(edge.x, 0.68, edge.z);
        edgeAnchor.rotation.y = angleY;

        const edgeMat = new StandardMaterial(`eMat_${edge.id}`, this.scene);
        edgeMat.diffuseColor = new Color3(1.0, 0.85, 0.2);
        edgeMat.emissiveColor = new Color3(0.4, 0.3, 0.05);
        edgeMat.alpha = 0.7;
        edgeAnchor.material = edgeMat;
        edgeAnchor.setEnabled(false); // Hidden during normal gameplay

        edgeAnchor.actionManager = new ActionManager(this.scene);
        edgeAnchor.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            this.callbacks.onEdgeClick?.(edge.id);
          })
        );

        this.edgeNodes.set(edge.id, edgeAnchor);

        // Directional Road Arrow
        const arrow = MeshBuilder.CreateCylinder(
          `arrow_${edge.id}`,
          { diameterTop: 0.0, diameterBottom: 0.38, height: 0.65, tessellation: 3 },
          this.scene
        );
        arrow.position = new Vector3(edge.x, 0.85, edge.z);
        arrow.rotation.x = Math.PI / 2;
        arrow.rotation.y = angleY;
        const arrowMat = new StandardMaterial(`arrMat_${edge.id}`, this.scene);
        arrowMat.diffuseColor = new Color3(1.0, 0.85, 0.2);
        arrowMat.emissiveColor = new Color3(0.5, 0.38, 0.04);
        arrow.material = arrowMat;
        arrow.setEnabled(false);

        this.roadArrowMeshes.set(edge.id, arrow);
      }
    }

    // 5. Robber / Corsair Token (Preloaded 3D Grim Reaper character model)
    const robberHex = board.hexes[board.robberHexId];
    if (robberHex) {
      this.updateRobberPosition(robberHex.x, robberHex.z);
    }
  }

  private createNumberToken(hexId: string, x: number, z: number, number: number, pips: number): void {
    const token = MeshBuilder.CreateCylinder(
      `token_${hexId}`,
      { diameter: 1.42, height: 0.12, tessellation: 32 },
      this.scene
    );
    token.position = new Vector3(x, 0.74, z);

    // 512x512 High-Resolution Dynamic Canvas Texture for crisp zero-blur rendering
    const tokenTexture = new DynamicTexture(`dyn_${number}`, { width: 512, height: 512 }, this.scene);
    tokenTexture.anisotropicFilteringLevel = 16;
    tokenTexture.updateSamplingMode(3);

    const ctx = tokenTexture.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, 512, 512);

    // Ceramic Ivory Outer Disc
    ctx.fillStyle = '#fef7e8';
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();

    // Subtle Outer Bevel Rim
    ctx.lineWidth = 14;
    ctx.strokeStyle = number === 6 || number === 8 ? '#dc2626' : '#92400e';
    ctx.stroke();

    // Inner Ring Accent
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(256, 256, 215, 0, Math.PI * 2);
    ctx.stroke();

    // Number text (Bold Red for 6 & 8, Dark Slate for others)
    ctx.fillStyle = number === 6 || number === 8 ? '#dc2626' : '#1e293b';
    ctx.font = 'bold 210px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), 256, 215);

    // Pip dots below number
    ctx.fillStyle = number === 6 || number === 8 ? '#dc2626' : '#1e293b';
    const dotSpacing = 28;
    const startX = 256 - ((pips - 1) * dotSpacing) / 2;
    for (let p = 0; p < pips; p++) {
      ctx.beginPath();
      ctx.arc(startX + p * dotSpacing, 385, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    tokenTexture.update();

    const tokenMat = new StandardMaterial(`tokenMat_${hexId}`, this.scene);
    tokenMat.diffuseTexture = tokenTexture;
    tokenMat.ambientColor = new Color3(1, 1, 1);
    tokenMat.specularColor = new Color3(0.06, 0.06, 0.06);
    tokenMat.specularPower = 64;
    token.material = tokenMat;

    this.tokenMeshes.set(hexId, token);
  }

  public syncGameState(gameState: GameState): void {
    this.renderBoard(gameState.board);

    // Update pieces on vertices (Settlements & Cities)
    for (const [vId, v] of Object.entries(gameState.board.vertices) as [string, BoardVertex][]) {
      const pieceKey = `v_piece_${vId}`;
      const vNode = this.vertexNodes.get(vId);

      if (v.building) {
        if (vNode) vNode.setEnabled(false);

        let pieceMesh = this.pieceMeshes.get(pieceKey);
        const playerColor = gameState.players[v.building.playerId]?.color || '#ffffff';

        if (!pieceMesh) {
          if (v.building.type === 'city') {
            // Authentic Fortified Stepped City Piece (Low wing + Cathedral tower with peaked gable roof)
            pieceMesh = this.createCityMesh(pieceKey, 1.0);
            pieceMesh.position = new Vector3(v.x, 0.68, v.z);
          } else {
            // Authentic Wooden Settlement House Piece (House base + Peaked gable roof)
            pieceMesh = this.createSettlementMesh(pieceKey, 0.95);
            pieceMesh.position = new Vector3(v.x, 0.68, v.z);
          }

          const mat = new StandardMaterial(`pieceMat_${vId}`, this.scene);
          mat.diffuseColor = Color3.FromHexString(playerColor);
          mat.specularColor = new Color3(0.25, 0.25, 0.25);
          this.applyPieceMaterial(pieceMesh, mat);
          this.pieceMeshes.set(pieceKey, pieceMesh);
        }
      } else {
        if (vNode) vNode.setEnabled(this.currentPlacementMode === 'settlement' || this.currentPlacementMode === 'city');
      }
    }

    // Update roads on edges
    for (const [eId, edge] of Object.entries(gameState.board.edges) as [string, BoardEdge][]) {
      const roadKey = `e_road_${eId}`;
      const edgeAnchor = this.edgeNodes.get(eId);
      const arrowMesh = this.roadArrowMeshes.get(eId);

      if (edge.road) {
        if (edgeAnchor) edgeAnchor.setEnabled(false);
        if (arrowMesh) arrowMesh.setEnabled(false);

        let roadMesh = this.pieceMeshes.get(roadKey);
        const playerColor = gameState.players[edge.road.playerId]?.color || '#ffffff';

        if (!roadMesh) {
          const [v1Id, v2Id] = edge.vertexIds;
          const v1 = gameState.board.vertices[v1Id];
          const v2 = gameState.board.vertices[v2Id];
          const angleY = v1 && v2 ? Math.atan2(v2.x - v1.x, v2.z - v1.z) : 0;

          roadMesh = MeshBuilder.CreateBox(roadKey, { width: 0.34, height: 0.34, depth: 1.7 }, this.scene);
          roadMesh.position = new Vector3(edge.x, 0.72, edge.z);
          roadMesh.rotation.y = angleY;

          const mat = new StandardMaterial(`roadMat_${eId}`, this.scene);
          mat.diffuseColor = Color3.FromHexString(playerColor);
          mat.specularColor = new Color3(0.3, 0.3, 0.3);
          roadMesh.material = mat;
          this.pieceMeshes.set(roadKey, roadMesh);
        }
      } else {
        if (edgeAnchor) edgeAnchor.setEnabled(this.currentPlacementMode === 'road');
      }
    }

    // Robber position update
    const robberHex = gameState.board.hexes[gameState.robberHexId];
    if (robberHex) {
      this.updateRobberPosition(robberHex.x, robberHex.z);
    }
  }

  private currentPlacementMode: 'none' | 'road' | 'settlement' | 'city' = 'none';

  /**
   * Highlights valid placement indicators (directional road arrows or vertex rings)
   * When mode is 'none', all indicators are hidden so the board terrain is 100% visible and clean.
   */
  public setPlacementMode(mode: 'none' | 'road' | 'settlement' | 'city'): void {
    this.currentPlacementMode = mode;
    if (mode === 'road') {
      this.roadArrowMeshes.forEach((arrow) => arrow.setEnabled(true));
      this.edgeNodes.forEach((edge) => edge.setEnabled(true));
      this.vertexNodes.forEach((node) => node.setEnabled(false));
    } else if (mode === 'settlement' || mode === 'city') {
      this.roadArrowMeshes.forEach((arrow) => arrow.setEnabled(false));
      this.edgeNodes.forEach((edge) => edge.setEnabled(false));
      this.vertexNodes.forEach((node) => node.setEnabled(true));
    } else {
      // Clean board view - hide all wireframe/anchor nodes
      this.roadArrowMeshes.forEach((arrow) => arrow.setEnabled(false));
      this.edgeNodes.forEach((edge) => edge.setEnabled(false));
      this.vertexNodes.forEach((node) => node.setEnabled(false));
    }
  }

  /**
   * Toggles between Angled 3D Perspective and Overhead Tactical View
   * (Matches 09_gameplay_3d_perspective.png and 10_gameplay_topdown_tactical.png)
   */
  public toggleCameraMode(): CameraViewMode {
    if (this.currentCameraMode === 'perspective') {
      this.setCameraMode('tactical');
    } else {
      this.setCameraMode('perspective');
    }
    return this.currentCameraMode;
  }

  public setCameraMode(mode: CameraViewMode): void {
    this.currentCameraMode = mode;
    if (mode === 'tactical') {
      // Pure top-down tactical angle
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = 0.05;
      this.camera.radius = 32;
      this.camera.target = new Vector3(0, 0, 0);
    } else {
      // Angled 3D tavern perspective
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = Math.PI / 3.4;
      this.camera.radius = 34;
      this.camera.target = new Vector3(0, 0, 0);
    }
  }

  public resetCamera(): void {
    this.setCameraMode('perspective');
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.clearBoard();
    this.terrainMaterials.forEach((mat) => mat.dispose());
    this.terrainMaterials.clear();
    if (this.blockSideMaterial) {
      this.blockSideMaterial.dispose();
      this.blockSideMaterial = null;
    }
    this.scene.dispose();
    this.engine.dispose();
  }
}
