import { CameraProjections, IfcViewerAPI, NavigationModes } from 'web-ifc-viewer';
import { createSideMenuButton } from './utils/gui-creator';
import {
  IFCSPACE, IFCOPENINGELEMENT, IFCWALLSTANDARDCASE, IFCWALL, IFCWINDOW, IFCCURTAINWALL, IFCMEMBER, IFCPLATE
} from 'web-ifc';
import { MeshBasicMaterial, LineBasicMaterial, Color, EdgesGeometry, LineSegments, Mesh, Vector3 } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { ClippingEdges } from 'web-ifc-viewer/dist/components/display/clipping-planes/clipping-edges';
import Stats from 'stats.js/src/Stats';
import Drawing from 'dxf-writer';

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(255, 255, 255) });
viewer.axes.setAxes();
viewer.grid.setGrid();
viewer.shadowDropper.darkness = 1.5;

// Set up stats
const stats = new Stats();
stats.showPanel(2);
document.body.append(stats.dom);
stats.dom.style.right = '0px';
stats.dom.style.left = 'auto';
viewer.context.stats = stats;

viewer.IFC.loader.ifcManager.useWebWorkers(true, 'files/IFCWorker.js');

viewer.IFC.loader.ifcManager.applyWebIfcConfig({
  USE_FAST_BOOLS: true,
  COORDINATE_TO_ORIGIN: true
});

// viewer.IFC.setWasmPath('files/');

// Setup loader

const lineMaterial = new LineBasicMaterial({ color: 0x555555 });
const baseMaterial = new MeshBasicMaterial({ color: 0xffffff, side: 2 });

let first = true;
let meshes;

ClippingEdges.createDefaultIfcStyles = false;

const loadIfc = async (event) => {


  // tests with glTF
  const file = event.target.files[0];
  const url = URL.createObjectURL(file);



  const result = await viewer.GLTF.load(url);

  meshes = [...result.children[0].children[0].children];
  ClippingEdges.edgesParent = result.children[0].children[0];

  let counter = 0;
  meshes.forEach(mesh => mesh.modelID = counter++);
  viewer.context.items.ifcModels.push(...meshes);
  viewer.context.items.pickableIfcModels.push(...meshes);


  // const scene = viewer.context.getScene();
  // meshes.forEach(mesh => {
  //   scene.attach(mesh);
  //   mesh.updateMatrix();
  // });
  // result.removeFromParent();


  // const result = await viewer.GLTF.exportIfcFileAsGltf(url);
  //
  // const link = document.createElement('a');
  // link.download = `${file.name}.gltf`;
  // document.body.appendChild(link);
  //
  // result.gltf.forEach(file => {
  //   link.href = URL.createObjectURL(file);
  //   link.click();
  //   }
  // )

  // link.remove();

  // __________________________________________________________

  // const overlay = document.getElementById('loading-overlay');
  // const progressText = document.getElementById('loading-progress');
  //
  // overlay.classList.remove('hidden');
  // progressText.innerText = `Loading`;
  //
  // viewer.IFC.loader.ifcManager.setOnProgress((event) => {
  //   const percentage = Math.floor((event.loaded * 100) / event.total);
  //   progressText.innerText = `Loaded ${percentage}%`;
  // });
  //
  // viewer.IFC.loader.ifcManager.parser.setupOptionalCategories({
  //   [IFCSPACE]: false,
  //   [IFCOPENINGELEMENT]: false
  // });
  //
  // model = await viewer.IFC.loadIfc(event.target.files[0], false);
  // model.material.forEach(mat => mat.side = 2);
  //
  // if(first) first = false
  // else {
  //   ClippingEdges.forceStyleUpdate = true;
  // }
  //
  // viewer.edges.create(`${model.modelID}`, model.modelID, lineMaterial, baseMaterial);
  //
  // await viewer.shadowDropper.renderShadow(model.modelID);
  //
  // overlay.classList.add('hidden');

};

const inputElement = document.createElement('input');
inputElement.setAttribute('type', 'file');
inputElement.classList.add('hidden');
inputElement.addEventListener('change', loadIfc, false);

let plane;
const handleKeyDown = async (event) => {
  if (event.code === 'Delete') {
    viewer.clipper.deletePlane();
    viewer.dimensions.delete();
  }
  if (event.code === 'Escape') {
    viewer.IFC.selector.unpickIfcItems();
  }
  if (event.code === 'KeyF') {
    const clippingPlanes = viewer.context.getClippingPlanes();
    meshes.material = new MeshBasicMaterial({clippingPlanes});
    const edges = new EdgesGeometry( meshes.geometry, 50 );

    const line = new LineSegments( edges, new LineBasicMaterial( {
      color: 0x000000,
      clippingPlanes
    } ) );

    viewer.context.getScene().add(line);
  }
  if (event.code === 'KeyO') {

    await viewer.context.ifcCamera.cameraControls.setPosition(0, 10, 0, true);
    // await viewer.context.ifcCamera.cameraControls.setTarget(0, 0, 0, true);
    viewer.context.ifcCamera.toggleProjection();

  }
  if(event.code === 'KeyP') {
    const clippingPlanes = viewer.context.getClippingPlanes();

    const meshWhiteMat = new MeshBasicMaterial({
      // map: mat.map,
      polygonOffset: true,
      polygonOffsetFactor: 10, // positive value pushes polygon further away
      polygonOffsetUnits: 1,
      clippingPlanes
    });

    const lineMaterial = new LineBasicMaterial({
      color: 0x444444,
      clippingPlanes
    });

    meshes.forEach(mesh => {
      const previousMaterial = mesh.material;
      mesh.material = meshWhiteMat;
      previousMaterial.dispose();

      const geo = new EdgesGeometry( mesh.geometry, 10 ); // or WireframeGeometry
      const mat = lineMaterial;
      const wireframe = new LineSegments( geo, mat );
      mesh.parent.add( wireframe );
    });

    const edges = Object.values(plane.edges.edges);
    edges.forEach(edge => {
      edge.mesh.position.y += 0.1;
    })
  }
  if (event.code === 'KeyI') {

    plane = viewer.clipper.createFromNormalAndCoplanarPoint(new Vector3(0, -1, 0), new Vector3(0, 5, 0), true);

  }
  else if(event.code === "KeyV") {
    plane.visible = false;
    viewer.dxf.initializeJSDXF(Drawing);
    viewer.edgesVectorizer.initializeOpenCV(cv);
    await viewer.edgesVectorizer.vectorize(50);
    console.log("finished!");
  }
  else if(event.code === "KeyC") {

    const drawingName = "example";

    viewer.dxf.newDrawing(drawingName);

    const polygons = viewer.edgesVectorizer.polygons;
    viewer.dxf.drawEdges(drawingName, polygons, 'projection', Drawing.ACI.BLUE );

    // const layer = Object.values(plane.edges.edges)[0];
    // // const coordinates = new Float32Array(55031);
    //  const array = Array.from(layer.generatorGeometry.attributes.position.array);
    // array.length = 55031;
    // viewer.dxf.draw(drawingName, array, 'Section', Drawing.ACI.RED);

    const result = viewer.dxf.exportDXF(drawingName);

    const link = document.createElement('a');
    link.download = "floorplan.dxf";
    link.href = URL.createObjectURL(result);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

// window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
window.onkeydown = handleKeyDown;
window.ondblclick = async () => {

  if (viewer.clipper.active) {
    viewer.clipper.createPlane();
    const edges = viewer.clipper.planes[0].edges;
    await edges.newStyleFromMesh('default', meshes, new LineMaterial({color: 0x000000, linewidth: 0.003, polygonOffset: true, polygonOffsetFactor: -20, polygonOffsetUnits: 1}));
  } else {
    const result = await viewer.IFC.selector.pickIfcItem(true);
    if (!result) return;
    const { modelID, id } = result;
    const props = await viewer.IFC.getProperties(modelID, id, true, false);
    console.log(props);
  }
};

//Setup UI
const loadButton = createSideMenuButton('./resources/folder-icon.svg');
loadButton.addEventListener('click', () => {
  loadButton.blur();
  inputElement.click();
});

const sectionButton = createSideMenuButton('./resources/section-plane-down.svg');
sectionButton.addEventListener('click', () => {
  sectionButton.blur();
  viewer.clipper.toggle();
});

const dropBoxButton = createSideMenuButton('./resources/dropbox-icon.svg');
dropBoxButton.addEventListener('click', () => {
  dropBoxButton.blur();
  viewer.dropbox.loadDropboxIfc();
});

