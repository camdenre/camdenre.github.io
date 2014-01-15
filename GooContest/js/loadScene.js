require([
	'goo/entities/GooRunner',
	'goo/statemachine/FSMSystem',
	'goo/addons/howler/systems/HowlerSystem',
	'goo/loaders/DynamicLoader',
	'goo/entities/EntityUtils',
	'goo/renderer/Camera',
	'goo/entities/components/ScriptComponent',
	'goo/scripts/OrbitCamControlScript',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/shapes/ShapeCreator',
	'goo/renderer/light/PointLight',
	'goo/math/Vector3'
], function (
	GooRunner,
	FSMSystem,
	HowlerSystem,
	DynamicLoader,
	EntityUtils,
	Camera,
	ScriptComponent,
	OrbitCamControlScript,
	Material,
	ShaderLib,
	ShapeCreator,
	PointLight,
	Vector3
) {
	'use strict';

	function init() {

		// If you try to load a scene without a server, you're gonna have a bad time
		if (window.location.protocol==='file:') {
			alert('You need to run this webpage on a server. Check the code for links and details.');
			return;

			/*

			Loading scenes uses AJAX requests, which require that the webpage is accessed via http. Setting up
			a web server is not very complicated, and there are lots of free options. Here are some suggestions
			that will do the job and do it well, but there are lots of other options.

			- Windows

			There's Apache (http://httpd.apache.org/docs/current/platform/windows.html)
			There's nginx (http://nginx.org/en/docs/windows.html)
			And for the truly lightweight, there's mongoose (https://code.google.com/p/mongoose/)

			- Linux
			Most distributions have neat packages for Apache (http://httpd.apache.org/) and nginx
			(http://nginx.org/en/docs/windows.html) and about a gazillion other options that didn't
			fit in here.
			One option is calling 'python -m SimpleHTTPServer' inside the unpacked folder if you have python installed.


			- Mac OS X

			Most Mac users will have Apache web server bundled with the OS.
			Read this to get started: http://osxdaily.com/2012/09/02/start-apache-web-server-mac-os-x/

			*/
		}

		// Make sure user is running Chrome/Firefox and that a WebGL context works
		var isChrome, isFirefox, isIE, isOpera, isSafari, isCocoonJS;
		isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
			isFirefox = typeof InstallTrigger !== 'undefined';
			isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
			isChrome = !!window.chrome && !isOpera;
			isIE = false || document.documentMode;
			isCocoonJS = navigator.appName === "Ludei CocoonJS";
		if (!(isFirefox || isChrome || isSafari || isCocoonJS || isIE === 11)) {
			alert("Sorry, but your browser is not supported.\nGoo works best in Google Chrome or Mozilla Firefox.\nYou will be redirected to a download page.");
			window.location.href = 'https://www.google.com/chrome';
		} else if (!window.WebGLRenderingContext) {
			alert("Sorry, but we could not find a WebGL rendering context.\nYou will be redirected to a troubleshooting page.");
			window.location.href = 'http://get.webgl.org/troubleshooting';
		} else {

			// Preventing brower peculiarities to mess with our control
			document.body.addEventListener('touchstart', function(event) {
				event.preventDefault();
			}, false);
			// Loading screen callback
			var progressCallback = function (handled, total) {
				var loadedPercent = (100*handled/total).toFixed();
				var loadingOverlay = document.getElementById("loadingOverlay");
				var progressBar = document.getElementById("progressBar");
				var progress = document.getElementById("progress");
				var loadingMessage = document.getElementById("loadingMessage");
				loadingOverlay.style.display = "block";
				loadingMessage.style.display = "block";
				progressBar.style.display = "block";
				progress.style.width = loadedPercent + "%";
			};

			// Create typical Goo application
			var goo = new GooRunner({
				antialias: true,
				manuallyStartGameLoop: true
			});
			var fsm = new FSMSystem(goo);
			goo.world.setSystem(fsm);
			goo.world.setSystem(new HowlerSystem());

			// The loader takes care of loading the data
			var loader = new DynamicLoader({
				world: goo.world,
				rootPath: 'res',
				progressCallback: progressCallback});

			loader.loadFromBundle('project.project', 'root.bundle', {recursive: false, preloadBinaries: true}).then(function(configs) {

				// This code will be called when the project has finished loading.
				goo.renderer.domElement.id = 'goo';
				document.body.appendChild(goo.renderer.domElement);

				// Application code goes here!
				//goo.renderer.setSize(800, 600);


				// Set up point light
				var pointLight = new PointLight();
				pointLight.intensity = 0.125;
				var lightEntity = EntityUtils.createTypicalEntity(goo.world, pointLight);
				lightEntity.addToWorld();
				lightEntity.transformComponent.setTranslation(0, 20, -4);

				// Set up the camera
				var camera = new Camera(30, 1, 0.1, 1000);
				var cameraEntity = EntityUtils.createTypicalEntity(goo.world, camera);
				//var cameraEntity = EntityUtils.createTypicalEntity(goo.world, camera, new OrbitCamControlScript(), [0,0,5]);
				cameraEntity.addToWorld();

				/*
				// Create the character
				var characterMaterial = Material.createMaterial(ShaderLib.simpleLit);
				characterMaterial.uniforms.materialAmbient = [0.5, 0, 0, 0.5];
				var characterMeshData = ShapeCreator.createBox(1, 1, 1, 1, 1);
				var characterEntity = EntityUtils.createTypicalEntity(goo.world, characterMeshData, characterMaterial, "character");
				characterEntity.addToWorld();
				*/

				goo.world.process();
				//var characterEntity = loader.getCachedObjectForRef('entities/cylinder.entity');
				//var characterEntity = goo.world.getManager("EntityManager").getEntityByName("PlaneBody");
				//var characterEntity = goo.world.entityManager.getEntityByName("PlaneBody");
				var characterEntity = loader.getCachedObjectForRef('character/entities/RootNode.entity');

				var balloonCounter = 0;
				var characterDamage = 0;

				// Create character platform (responsible for character movement along the track)
				//var characterPlatformMaterial = Material.createMaterial(ShaderLib.simpleLit);
				//characterPlatformMaterial.uniforms.materialAmbient = [0, 0, 0, 0];
				var characterPlatformMeshData = ShapeCreator.createQuad(8, 1, 1, 1);
				//var characterPlatformEntity = EntityUtils.createTypicalEntity(goo.world, characterPlatformMeshData, characterPlatformMaterial);
				var characterPlatformEntity = EntityUtils.createTypicalEntity(goo.world, characterPlatformMeshData);
				characterPlatformEntity.addToWorld();
				characterPlatformEntity.transformComponent.attachChild(characterEntity.transformComponent);
				characterPlatformEntity.transformComponent.attachChild(cameraEntity.transformComponent);
				characterPlatformEntity.transformComponent.setTranslation(0, 0, -0.5);
				characterPlatformEntity.transformComponent.setRotation(-Math.PI/2, 0, 0);

				characterEntity.transformComponent.setTranslation(0, 0, 0.5);
				characterEntity.transformComponent.setRotation(Math.PI/2, 0, 0);
				cameraEntity.transformComponent.setTranslation(0, -8, 4);
				cameraEntity.transformComponent.setRotation((Math.PI/2) - 15 * (Math.PI/ 180), 0, 0);
				//cameraEntity.transformComponent.setTranslation(-15, 0, 0);
				//cameraEntity.transformComponent.setRotation((Math.PI/2), 0, -(Math.PI/2));

				var createTrackSegment = function(track, position) {
					var trackMaterial = Material.createMaterial(ShaderLib.simpleLit);
					trackMaterial.uniforms.materialAmbient = [0, 0, 0, 0];
					var trackMeshData = ShapeCreator.createQuad(4, 1, 1, 1);
					var trackSegmentEntity = EntityUtils.createTypicalEntity(goo.world, trackMeshData, trackMaterial);
					trackSegmentEntity.addToWorld();
					track.transformComponent.attachChild(trackSegmentEntity.transformComponent);
					trackSegmentEntity.transformComponent.setTranslation(0, 0, -position);
					trackSegmentEntity.transformComponent.setRotation(-Math.PI/2, 0, 0);
					return trackSegmentEntity;
				}
				/*
				for (var i = 0; i < 90; i++) {
					createTrackSegment(trackEntity, i);
				}
				*/

				var bezierPoints = [];

				var iters = 0;
				//var error = 0.05;
				var error = 0.00000005;
				// De Casteljau
				var computeCubicBezierPoints = function(p1, p2, p3, p4) {
				    var p12 = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: (p1.z + p2.z) / 2};
				    var p23 = {x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2, z: (p2.z + p3.z) / 2};
				    var p34 = {x: (p3.x + p4.x) / 2, y: (p3.y + p4.y) / 2, z: (p3.z + p4.z) / 2};
				    var p123 = {x: (p12.x + p23.x) / 2, y: (p12.y + p23.y) / 2, z: (p12.z + p23.z) / 2};
				    var p234 = {x: (p23.x + p34.x) / 2, y: (p23.y + p34.y) / 2, z: (p23.z + p34.z) / 2};
				    var p1234 = {x: (p123.x + p234.x) / 2, y: (p123.y + p234.y) / 2, z: (p123.z + p234.z) / 2};
				    
				    // Try to approximate the full cubic curve by a single straight line
				    //------------------
				    var lineMidpoint = {x: (p4.x + p1.x) / 2, y: (p4.y + p1.y) / 2, z: (p4.z + p1.z) / 2};
				    var d1234 = Math.sqrt(Math.pow((lineMidpoint.x - p1234.x), 2) + Math.pow((lineMidpoint.y - p1234.y), 2) + Math.pow((lineMidpoint.z - p1234.z), 2));
				    if(d1234 < error && iters !== 0) {
				        bezierPoints.push({x: p1234.x, y: Math.abs(p1234.y), z: p1234.z});
				        return;
				    }

				    iters += 1;
				    
				    // Continue subdivision
				    //----------------------
				    computeCubicBezierPoints(p1, p12, p123, p1234); 
				    computeCubicBezierPoints(p1234, p234, p34, p4);
				}

				var c1 = [{x: 0.0000, y: 0.0000, z: 0.0000}, {x: 4.9606, y: -3.0856, z: -31.6712}, {x: -1.0772, y: 16.7548, z: -43.4602}, {x: -15.2646, y: 16.5748, z: -59.7622}];
				var c2 = [{x: -15.2646, y: 16.5748, z: -59.7622}, {x: -32.9589, y: 16.3503, z: -80.0938}, {x: 0.0810, y: -11.7500, z: -110.4498}, {x: 29.5463, y: 5.5805, z: -151.2527}];
				var c3 = [{x: 29.5463, y: 5.5805, z: -151.2527}, {x: 44.4116, y: 14.3238, z: -171.8380}, {x: 44.9936, y: 7.0302, z: -181.5337}, {x: 45.9405, y: 7.5006, z: -206.6066}];
				var c4 = [{x: 45.9405, y: 7.5006, z: -206.6066}, {x: 47.0092, y: 8.0314, z: -234.9026}, {x: -24.9238, y: 10.0360, z: -206.8762}, {x: -23.4021, y: 10.5639, z: -234.2749}];
				var c5 = [{x: -23.4021, y: 10.5639, z: -234.2749}, {x: -21.5840, y: 11.1945, z: -267.0076}, {x: 31.7227, y: 4.5538, z: -237.7962}, {x: 45.4409, y: 5.0000, z: -259.9224}];
				var c6 = [{x: 45.4409, y: 5.0000, z: -259.9224}, {x: 66.3517, y: 5.6802, z: -293.6496}, {x: -31.9861, y: 9.7224, z: -267.2188}, {x: -31.1611, y: 10.2512, z: -294.2213}];
				var c7 = [{x: -31.1611, y: 10.2512, z: -294.2213}, {x: -29.8944, y: 11.0631, z: -335.6844}, {x: -2.9335, y: 9.6866, z: -299.1499}, {x: 46.5606, y: 10.0000, z: -312.4855}];
				var c8 = [{x: 46.5606, y: 10.0000, z: -312.4855}, {x: 78.5224, y: 10.2024, z: -321.0972}, {x: 39.7258, y: 3.4218, z: -345.1190}, {x: 37.1715, y: 15.4670, z: -377.1968}];
				var c9 = [{x: 37.1715, y: 15.4670, z: -377.1968}, {x: 34.0969, y: 29.9661, z: -415.8099}, {x: 108.3578, y: 2.6197, z: -379.1199}, {x: 114.7071, y: 13.4622, z: -414.9144}];
				var c10 = [{x: 114.7071, y: 13.4622, z: -414.9144}, {x: 125.2212, y: 31.4169, z: -474.1882}, {x: 42.1785, y: -5.7775, z: -545.8625}, {x: 54.6063, y: 2.1639, z: -564.2448}];

				computeCubicBezierPoints.apply(undefined, c1);
				computeCubicBezierPoints.apply(undefined, c2);
				computeCubicBezierPoints.apply(undefined, c3);
				computeCubicBezierPoints.apply(undefined, c4);
				computeCubicBezierPoints.apply(undefined, c5);
				computeCubicBezierPoints.apply(undefined, c6);
				computeCubicBezierPoints.apply(undefined, c7);
				computeCubicBezierPoints.apply(undefined, c8);
				computeCubicBezierPoints.apply(undefined, c9);
				computeCubicBezierPoints.apply(undefined, c10);
				
				var cumSegmentSum = [];
				for (var i = 1; i < bezierPoints.length; i++) {
				    var p1 = bezierPoints[i];
				    var p0 = bezierPoints[i - 1];
				    var dp = {x: (p1.x - p0.x), y: (p1.y - p0.y), z: (p1.z - p0.z)};
				    var segmentLength = Math.sqrt(dp.x*dp.x + dp.y*dp.y + dp.z*dp.z);
				    var totalSum;
				    if (cumSegmentSum.length > 0) {
				        totalSum = cumSegmentSum[cumSegmentSum.length - 1] + segmentLength;
				    } else {
				        totalSum = segmentLength
				    }
				    cumSegmentSum.push(totalSum);
				}

				
				// Set character movement along the track
				var calculatePlatformRotationAndLocation = function(arcLength) {
					var rotation = {x: 0, y: 0, z: 0};
					var coords = {x: 0, y: 0, z: 0};
					for (var i = 0; i < cumSegmentSum.length; i++) {
				        if (arcLength < cumSegmentSum[i]) {
				            var p1 = bezierPoints[i + 1];
				            var p0 = bezierPoints[i];
				            var extraLength;
				            var segLength;
				            if (i === 0) {
				                extraLength = arcLength;
				                segLength = cumSegmentSum[i];
				            } else {
				                extraLength = arcLength - cumSegmentSum[i - 1];    
				                segLength = cumSegmentSum[i] - cumSegmentSum[i - 1];
				            }
				            var epsilon = extraLength / segLength;
				            var dp = {x: (p1.x - p0.x), y: (p1.y - p0.y), z: (p1.z - p0.z)};
				            coords = {x: p0.x + epsilon * dp.x, y: p0.y + epsilon * dp.y, z: p0.z + epsilon * dp.z};
				            characterPlatformEntity.transformComponent.transform.rotation.lookAt( new Vector3(dp.x,dp.y,dp.z), new Vector3(0, -1, 0) );
				            rotation = new Vector3(0, 0 , 0);
				            characterPlatformEntity.transformComponent.transform.rotation.toAngles(rotation);
				            rotation.x = (Math.PI/2) + rotation.x;
					        break;
				        }
				    }
				    return {coords: coords, rotation: rotation}
				}

				var characterPlatformArcLength = 0;
				var enemyPlatformList = {};

				var createEnemyPlatform = function(arcLength, configuration) {

					//var enemyPlatformMaterial = Material.createMaterial(ShaderLib.simpleLit);
					//enemyPlatformMaterial.uniforms.materialAmbient = [0.5, 0.5, 0.5, 0.5];
					var enemyPlatformMeshData = ShapeCreator.createQuad(8, 1, 1, 1);
					var enemyPlatformEntity = EntityUtils.createTypicalEntity(goo.world, enemyPlatformMeshData, "enemyPlatform1");
					enemyPlatformEntity.addToWorld();
					var coordsAndRot = calculatePlatformRotationAndLocation(arcLength);
					var c = coordsAndRot.coords;
					var r = coordsAndRot.rotation;
					enemyPlatformEntity.transformComponent.setTranslation(c.x, c.y, c.z);
					enemyPlatformEntity.transformComponent.setRotation(r.x, r.y, r.z);


					/*var enemyMaterial2 = Material.createMaterial(ShaderLib.simpleLit);
					enemyMaterial2.uniforms.materialAmbient = [0.5, 0, 0, 0.5];
					var enemyMeshData2 = ShapeCreator.createBox(0.1, 0.1, 0.1, 0.1, 0.1);
					var enemyEntity2 = EntityUtils.createTypicalEntity(goo.world, enemyMeshData2, enemyMaterial2, "balloon");
					enemyEntity2.addToWorld();

					enemyPlatformEntity.transformComponent.attachChild(enemyEntity2.transformComponent);
					enemyEntity2.transformComponent.setTranslation(0, 0, 0);
					enemyEntity2.transformComponent.setRotation(0, 0, 0);*/

					for (var i = 0; i < configuration.length; i++) {
						if (configuration[i] === "b") {
							//var enemyMaterial = Material.createMaterial(ShaderLib.simpleLit);
							//enemyMaterial.uniforms.materialAmbient = [0.5, 0, 0, 0.5];
							//var enemyMeshData = ShapeCreator.createBox(1, 1, 1, 1, 1);
							//var enemyEntity = EntityUtils.createTypicalEntity(goo.world, enemyMeshData, enemyMaterial, "balloon");
							//enemyEntity.addToWorld();
							var refEntity = loader.getCachedObjectForRef('balloon/entities/RootNode.entity');
							var enemyEntity = EntityUtils.clone(goo.world, refEntity);
							enemyEntity.addToWorld();
							enemyPlatformEntity.transformComponent.attachChild(enemyEntity.transformComponent);
							enemyEntity.transformComponent.setTranslation(2 * i - 2.5, 0.125, 0.3);
							//enemyEntity.transformComponent.setTranslation(-0.5, -0.5, -0.2);
							enemyEntity.transformComponent.setRotation(Math.PI/2, 0, 0);
						} else if (configuration[i] === "e1") {
							//var enemyMaterial = Material.createMaterial(ShaderLib.simpleLit);
							//enemyMaterial.uniforms.materialAmbient = [0.5, 0.5, 0, 0.5];
							//var enemyMeshData = ShapeCreator.createBox(1, 1, 1, 1, 1);
							//var enemyEntity = EntityUtils.createTypicalEntity(goo.world, enemyMeshData, enemyMaterial, "stormCloud/entities/RootNode.entity");
							var refEntity = loader.getCachedObjectForRef('stormCloud/entities/RootNode.entity');
							var enemyEntity = EntityUtils.clone(goo.world, refEntity);
							enemyEntity.addToWorld();
							enemyPlatformEntity.transformComponent.attachChild(enemyEntity.transformComponent);
							enemyEntity.transformComponent.setTranslation(2*i - 2.35, 0.375, 0.25);
							enemyEntity.transformComponent.setRotation(Math.PI/2, 0, 0);
						} else if (configuration[i] === "e2") {
							//var enemyMaterial = Material.createMaterial(ShaderLib.simpleLit);
							//enemyMaterial.uniforms.materialAmbient = [0.5, 0.5, 0.5, 0.5];
							//var enemyMeshData = ShapeCreator.createBox(1, 1, 1, 1, 1);
							//var enemyEntity = EntityUtils.createTypicalEntity(goo.world, enemyMeshData, enemyMaterial, "lightningBolt/entities/RootNode.entity");
							var refEntity = loader.getCachedObjectForRef('lightningBolt/entities/RootNode.entity');
							var enemyEntity = EntityUtils.clone(goo.world, refEntity);
							enemyEntity.addToWorld();
							enemyPlatformEntity.transformComponent.attachChild(enemyEntity.transformComponent);
							enemyEntity.transformComponent.setTranslation(2*i - 2.5, 0, 0);
							enemyEntity.transformComponent.setRotation(Math.PI/2, 0, 0);
						}
					}

					enemyPlatformList[arcLength] = enemyPlatformEntity;
				}

				var createMovingEnemyPlatform = function(arcLength) {

					// Create the enemy
					/*var enemyMaterial = Material.createMaterial(ShaderLib.simpleLit);
					enemyMaterial.uniforms.materialAmbient = [0.5, 0.5, 0, 0.5];
					var enemyMeshData = ShapeCreator.createBox(1, 1, 1, 1, 1);
					var enemyEntity = EntityUtils.createTypicalEntity(goo.world, enemyMeshData, enemyMaterial, "enemy1");
					enemyEntity.addToWorld();*/

					var refEntity = loader.getCachedObjectForRef('stormCloud/entities/RootNode.entity');
					var enemyEntity = EntityUtils.clone(goo.world, refEntity);
					enemyEntity.addToWorld();
					//enemyPlatformEntity.transformComponent.attachChild(enemyEntity.transformComponent);
					//enemyEntity.transformComponent.setTranslation(2*i - 2.35, 0, 0.25);
					//enemyEntity.transformComponent.setRotation(Math.PI/2, 0, 0);

					var enemyPlatformMeshData = ShapeCreator.createQuad(8, 1, 1, 1);
					var enemyPlatformEntity = EntityUtils.createTypicalEntity(goo.world, enemyPlatformMeshData);
					enemyPlatformEntity.addToWorld();
					enemyPlatformEntity.transformComponent.attachChild(enemyEntity.transformComponent);
					var coordsAndRot = calculatePlatformRotationAndLocation(arcLength);
					var c = coordsAndRot.coords;
					var r = coordsAndRot.rotation;
					enemyPlatformEntity.transformComponent.setTranslation(c.x, c.y, c.z);
					enemyPlatformEntity.transformComponent.setRotation(r.x, r.y, r.z);

					enemyEntity.transformComponent.setTranslation(-0.35, 0, 0.25);
					enemyEntity.transformComponent.setRotation(Math.PI/2, 0, 0);

					enemyPlatformList[arcLength] = enemyPlatformEntity;

					var movingEnemyCurrentTime = 0;
					var speedT = 0.25;
					var startT = 0;
					var endT = 1;
					var movingEnemyTotalTime = (endT - startT) / speedT;

					enemyEntity.setComponent(new ScriptComponent({
			    		run: function(_entity) {
			    			movingEnemyCurrentTime += goo.world.tpf;
			    			//startTranslationX = characterEntity.transformComponent.transform.translation.x;
			    			if (movingEnemyCurrentTime < movingEnemyTotalTime) {
	    						var lerpFactor = movingEnemyCurrentTime/movingEnemyTotalTime;
	    						var interp = lerpFactor;
	    						var positionX;
	    						if (interp >= 0 && interp < 0.25) {
	    							positionX = 8 * interp;
	    						} else if (interp >= 0.25 && interp < 0.75) {
	    							positionX = -8 * interp + 4;
	    						} else if (interp >= 0.75 && interp < 1) {
	    							positionX = 8 * interp - 8;
	    						}
	    						enemyEntity.transformComponent.setTranslation(positionX - 0.35, 0, 0.25);
	    					} else {
	    						movingEnemyCurrentTime = 0;
	    					}
			    		}
			    	}));
			    	
				}

				// This section defines the collision detection (AABB).
				var characterWidth = {x: 1, y: 0.93, z: 0.195};
				var balloonWidth = {x: 0.25, y: 0.25, z: 0.3}
				var enemy1Width = {x: 0.9, y: 0.5, z: 0.5};
				var enemy2Width = {x: 1, y: 0.25, z: 1.75};

				cameraEntity.setComponent(new ScriptComponent({
			    	run: function(_entity) {
			    		var enemyPlatform;
			    		var characterOffset;
			    		for (var key in enemyPlatformList) {
						    if (Math.abs(key - characterPlatformArcLength) < 1) {
						    	enemyPlatform = enemyPlatformList[key];
						    	characterOffset = characterPlatformArcLength - key;
						    	break;
						    }
						}
						if (typeof enemyPlatform !== "undefined") {
							var characterXMin = characterEntity.transformComponent.transform.translation.x - 0.5;
							var characterXMax = characterXMin + characterWidth.x;
							var characterYMin = characterOffset - 0.5;
							var characterYMax = characterYMin + characterWidth.y;
							var characterZMin = characterEntity.transformComponent.transform.translation.z - 0.1;
							var characterZMax = characterZMin + characterWidth.z;
							var enemyList = EntityUtils.getChildren(enemyPlatform);
							for (var i = 0; i < enemyList.length; i++) {
								var enemyXMin;
								var enemyXMax;
								var enemyYMin;
								var enemyYMax;
								var enemyZMin;
								var enemyZMax;
								var enemy = enemyList[i];
								var width = {};
								if (enemy.toString() === "stormCloud/entities/RootNode.entity") {
									width = enemy1Width;
									enemyXMin = enemy.transformComponent.transform.translation.x;
									enemyXMax = enemyXMin + width.x;
									enemyYMin = enemy.transformComponent.transform.translation.y - 0.25;
									enemyYMax = enemyYMin + width.y;
									enemyZMin = enemy.transformComponent.transform.translation.z;
									enemyZMax = enemyZMin + width.z;
								} else if (enemy.toString() === "lightningBolt/entities/RootNode.entity") {
									width = enemy2Width;
									enemyXMin = enemy.transformComponent.transform.translation.x;
									enemyXMax = enemyXMin + width.x;
									enemyYMin = enemy.transformComponent.transform.translation.y;
									enemyYMax = enemyYMin + width.y;
									enemyZMin = enemy.transformComponent.transform.translation.z;
									enemyZMax = enemyZMin + width.z;
								} else if (enemy.toString() === "balloon/entities/RootNode.entity") {
									width = balloonWidth;
									enemyXMin = enemy.transformComponent.transform.translation.x + 0.375;
									enemyXMax = enemyXMin + width.x;
									enemyYMin = enemy.transformComponent.transform.translation.y + 0.375;
									enemyYMax = enemyYMin + width.y;
									enemyZMin = enemy.transformComponent.transform.translation.z + 0.2;
									enemyZMax = enemyZMin + width.z;
								}

								

								if (characterXMax < enemyXMin || 
					                characterYMax < enemyYMin ||
					                characterZMax < enemyZMin ||
					                characterXMin > enemyXMax || 
					                characterYMin > enemyYMax ||
					                characterZMin > enemyZMax) 
					            {
					            } else {
					            	if (!leftDamageRotate && !rightDamageRotate && !stabilizeRotateZ) {
						            	if (enemy.toString() === "balloon/entities/RootNode.entity") {
						            		balloonCounter += 1;
						            		document.getElementById("balloonCount").innerHTML = balloonCounter;
						            		enemy.removeFromWorld(true);
						            	} else if (enemy.toString() === "stormCloud/entities/RootNode.entity") {
						            		characterDamage += 1;
						            		var elem = document.getElementById(("life" + characterDamage));
						            		elem.parentNode.removeChild(elem);
						            		if (characterDamage === 3) {
						            			characterEntity.clearComponent("ScriptComponent");
						            			characterPlatformEntity.clearComponent("ScriptComponent");
						            			document.getElementById("finalScore").innerHTML = balloonCounter;
						            			document.getElementById("credits").style.visibility = "visible";
						            		}
						            		leftDamageRotate = true;
						            		updateCharacterPosition();
						            	} else if (enemy.toString() === "lightningBolt/entities/RootNode.entity") {
						            		characterDamage += 1;
						            		var elem = document.getElementById(("life" + characterDamage));
						            		elem.parentNode.removeChild(elem);
						            		if (characterDamage === 3) {
						            			characterEntity.clearComponent("ScriptComponent");
						            			characterPlatformEntity.clearComponent("ScriptComponent");
						            			document.getElementById("finalScore").innerHTML = balloonCounter;
						            			document.getElementById("credits").style.visibility = "visible";
						            		}
						            		leftDamageRotate = true;
						            		updateCharacterPosition();
						            	}
						            }
					            }
							}
						}
			    	}
			    }));

				//createEnemyPlatform(80, [0, 0, "e2"]);
				//createEnemyPlatform(81.5, ["b", 0, 0]);
				//createEnemyPlatform(83, [0, "e1", 0]);
				//createEnemyPlatform(24.5, [0, "e2", 0]);
				//createEnemyPlatform(47, ["b", "b", "b"]);

				//createMovingEnemyPlatform(26);
				//createEnemyPlatform(84.5);

				for (var i = 0; i < 8; i++) {
					createEnemyPlatform((31 + (4*i)), [0, "b", 0]);
				}

				/*for (var i = 0; i < 5; i++) {
					createEnemyPlatform((41 + (2*i)), [0, 0, "b"]);
				}

				for (var i = 0; i < 5; i++) {
					createEnemyPlatform((51 + (2*i)), ["b", 0, 0]);
				}*/

				createEnemyPlatform(85, ["e1", "e1", "b"]);

				createEnemyPlatform(90, [0, 0, "e1"]);

				createEnemyPlatform(95, [0, "e1", 0]);

				createEnemyPlatform(100, ["e1", 0, 0]);

				createEnemyPlatform(105, [0, "e1", 0]);

				createEnemyPlatform(110, [0, 0, "e1"]);

				createEnemyPlatform(115, [0, "b", 0]);

				createEnemyPlatform(118, ["b", 0, 0]);

				createEnemyPlatform(121, [0, "b", 0]);

				createEnemyPlatform(124, [0, 0, "b"]);

				createEnemyPlatform(127, [0, 0, "b"]);

				createEnemyPlatform(130, [0, 0, "b"]);

				createMovingEnemyPlatform(150);

				createEnemyPlatform(170, ["e2", "e2", 0]);

				createEnemyPlatform(180, ["e1", "e1", "e1"]);

				createEnemyPlatform(190, ["e1", "e1", "e1"]);

				createEnemyPlatform(195, ["b", "e1", "e1"]);

				createEnemyPlatform(200, ["e1", "b", "e1"]);

				createEnemyPlatform(205, ["e2", "b", "e2"]);

				createEnemyPlatform(225, ["e2", "b", "e2"]);

				createEnemyPlatform(230, ["e2", "b", "e2"]);

				createEnemyPlatform(235, ["e2", "b", "e2"]);

				createEnemyPlatform(240, ["e2", "b", "e2"]);

				createEnemyPlatform(245, ["e2", "e2", "b"]);

				createEnemyPlatform(280, ["e1", "e1", "e1"]);

				createEnemyPlatform(290, ["e1", "e1", "b"]);

				createEnemyPlatform(300, ["e1", "e1", "e1"]);

				createEnemyPlatform(310, ["e1", "b", "e1"]);

				createMovingEnemyPlatform(330);

				createEnemyPlatform(350, ["b", "b", "b"]);
				createEnemyPlatform(352, ["b", "b", "b"]);
				createEnemyPlatform(354, ["b", "b", "b"]);
				createEnemyPlatform(356, ["b", "b", "b"]);
				createEnemyPlatform(358, ["b", "b", "b"]);
				createEnemyPlatform(360, ["b", "b", "b"]);
				createEnemyPlatform(362, ["b", "b", "b"]);
				createEnemyPlatform(364, ["b", "b", "b"]);

				//createMovingEnemyPlatform(380);

				createEnemyPlatform(400, ["e2", "e2", 0]);
				createEnemyPlatform(405, ["e2", 0, "e2"]);
				createEnemyPlatform(410, [0, "e2", "e2"]);
				createEnemyPlatform(415, ["e2", 0, "e2"]);
				createEnemyPlatform(420, ["e2", "e2", 0]);
				createEnemyPlatform(425, ["e2", 0, "e2"]);
				createEnemyPlatform(430, [0, "e2", "e2"]);
				createEnemyPlatform(435, ["e2", 0, "e2"]);
				createEnemyPlatform(440, ["e2", "e2", 0]);
				createEnemyPlatform(445, ["e2", 0, "e2"]);
				createEnemyPlatform(450, [0, "e2", "e2"]);
				createEnemyPlatform(455, ["e2", 0, "e2"]);

				createEnemyPlatform(480, ["e1", "e1", "e1"]);

				createEnemyPlatform(482, ["e1", "e1", "e1"]);

				createEnemyPlatform(490, ["e1", "e1", "e1"]);

				createEnemyPlatform(492, ["e1", "e1", "e1"]);

				createEnemyPlatform(500, ["e1", "e1", "e1"]);

				createEnemyPlatform(502, ["e1", "e1", "e1"]);

				createEnemyPlatform(510, ["e1", "e1", "e1"]);

				createEnemyPlatform(512, ["e1", "e1", "e1"]);

				createEnemyPlatform(520, ["e1", "e1", "e1"]);

				createEnemyPlatform(522, ["e1", "e1", "e1"]);

				createEnemyPlatform(530, ["e1", "e1", "e1"]);

				createEnemyPlatform(532, ["e1", "e1", "e1"]);

				createEnemyPlatform(550, ["b", "b", "b"]);
				createEnemyPlatform(552, ["b", "b", "b"]);
				createEnemyPlatform(554, ["b", "b", "b"]);
				createEnemyPlatform(556, ["e1", "e2", "e1"]);
				createEnemyPlatform(558, ["b", "b", "b"]);
				createEnemyPlatform(560, ["b", "b", "b"]);
				createEnemyPlatform(562, ["b", "b", "b"]);
				createEnemyPlatform(564, ["b", "b", "b"]);

				//createMovingEnemyPlatform(580);

				createEnemyPlatform(600, ["e1", "e1", 0]);
				createEnemyPlatform(605, ["e1", "b", "e1"]);
				createEnemyPlatform(610, [0, "e1", "e1"]);
				createEnemyPlatform(615, ["e1", "b", "e1"]);
				createEnemyPlatform(620, ["e1", "e1", 0]);
				createEnemyPlatform(625, ["e1", "b", "e1"]);
				createEnemyPlatform(630, [0, "e1", "e1"]);
				createEnemyPlatform(635, ["e1", "b", "e1"]);
				createEnemyPlatform(640, ["e1", "e1", 0]);
				createEnemyPlatform(645, ["e1", "b", "e1"]);
				createEnemyPlatform(650, [0, "e1", "e1"]);
				createEnemyPlatform(655, ["e1", "b", "e1"]);
				createEnemyPlatform(660, ["e2", "e2", 0]);
				createEnemyPlatform(665, ["e2", 0, "e2"]);
				createEnemyPlatform(670, [0, "e2", "e2"]);
				createEnemyPlatform(675, ["e2", 0, "e2"]);
				createEnemyPlatform(680, ["e2", "e2", 0]);
				createEnemyPlatform(685, ["e2", 0, "e2"]);
				createEnemyPlatform(690, [0, "e2", "e2"]);
				createEnemyPlatform(695, ["e2", 0, "e2"]);
				createEnemyPlatform(700, ["e2", "e2", 0]);
				createEnemyPlatform(705, ["e2", 0, "e2"]);
				createEnemyPlatform(710, [0, "e2", "e2"]);
				createEnemyPlatform(715, ["e2", 0, "e2"]);				

				createMovingEnemyPlatform(750);
				createEnemyPlatform(755, [0, "b", 0]);
				createMovingEnemyPlatform(760);
				createEnemyPlatform(765, [0, "b", 0]);
				createMovingEnemyPlatform(770);
				createEnemyPlatform(775, [0, "b", 0]);
				createMovingEnemyPlatform(780);
				createEnemyPlatform(785, [0, "b", 0]);
				createMovingEnemyPlatform(790);
				createEnemyPlatform(795, [0, "b", 0]);
				createMovingEnemyPlatform(800);
				createEnemyPlatform(805, [0, "b", 0]);



			    var trackSpeed = 9;
			    var characterPlatformCurrentTime = 0;
			    var startPositionArcLength = 0;
			    var endPositionArcLength = cumSegmentSum[cumSegmentSum.length - 1];
			    var characterPlatformTotalTime = (endPositionArcLength - startPositionArcLength) / trackSpeed;
			    characterPlatformEntity.setComponent(new ScriptComponent({
			    	run: function(_entity) {
			    		characterPlatformCurrentTime += goo.world.tpf;
    					var lerpFactor = characterPlatformCurrentTime/characterPlatformTotalTime;
    					var interpArcLength = lerpFactor * (endPositionArcLength - startPositionArcLength);
    					characterPlatformArcLength = interpArcLength;
    					var coordsRotation = calculatePlatformRotationAndLocation(interpArcLength);
    					var c = coordsRotation.coords;
    					var r = coordsRotation.rotation;

    					characterPlatformEntity.transformComponent.setTranslation(c.x, c.y, c.z);
					    characterPlatformEntity.transformComponent.setRotation(r.x, r.y, r.z);
					    if (interpArcLength > 850) {
					    	characterPlatformEntity.clearComponent('ScriptComponent');
					    	characterEntity.clearComponent('ScriptComponent');
					    	document.getElementById("finalScore").innerHTML = balloonCounter;
						    document.getElementById("credits").style.visibility = "visible";
					    }
    					if (characterPlatformCurrentTime >= characterPlatformTotalTime) {
    						characterPlatformEntity.clearComponent('ScriptComponent');
    						characterPlatformEntity.transformComponent.setRotation(-Math.PI/2, 0, 0);
	    				}
			    	}
			    }));

				/////////////********** CHARACTER MOVEMENT *************///////////////////
				///////////////////////////////////////////////////////////////////////////
				///////////////////////////////////////////////////////////////////////////

				var characterPosition = 0;
				var leftTurnRotate = false;
				var rightTurnRotate = false;
				var stabilizeRotateY = false;
				var stabilizeRotateX = false;
				var jumpAscend = false;
				var jumpDescend = false;
				var jumpPause = false;
				var jumpPauseStabilize = false;
				var leftDamageRotate = false;
				var rightDamageRotate = false;
				var stabilizeRotateZ = false;

				var startTranslationX;
				var startTranslationY;
				var startTranslationZ;
				var startRotationX;
				var startRotationY;
				var startRotationZ;
				var endTranslationX;
				var translationSpeedX;
				var endTranslationY;
				var translationSpeedY;
				var endTranslationZ;
				var translationSpeedZ;
				var endRotationX;
				var rotationSpeedX;
				var endRotationY;
				var rotationSpeedY;
				var endRotationZ;
				var rotationSpeedZ;
				var currentTimeCharacter;
				var totalTimeTranslationX;
				var totalTimeTranslationY;
				var totalTimeTranslationZ;
				var totalTimeRotationX;
				var totalTimeRotationY;
				var totalTimeRotationZ;
				var totalTimePause;
				var maxTimeCharacter;

				var refreshCharacterMovementData = function() {
					// Move the character according to its state
					startTranslationX = characterEntity.transformComponent.transform.translation.x;
					startTranslationY = characterEntity.transformComponent.transform.translation.y;
					startTranslationZ = characterEntity.transformComponent.transform.translation.z;
					startRotationX = characterEntity.transformComponent.transform.rotation.toAngles().x;
					startRotationY = characterEntity.transformComponent.transform.rotation.toAngles().y;
					startRotationZ = characterEntity.transformComponent.transform.rotation.toAngles().z;

					endTranslationX = 2*characterPosition;

					translationSpeedX = 5;

					endTranslationY = 0;

					translationSpeedY = 0;

					endRotationX = Math.PI/2;
					rotationSpeedX = 0;
					if (jumpAscend) {
						endTranslationZ = 1.75;
						translationSpeedZ = 2 * trackSpeed / 4;
						endRotationX = 20 * (Math.PI / 180) + Math.PI/2;
						rotationSpeedX = Math.PI/3;
					} else if (jumpDescend) {
						endTranslationZ = 0.5;
						translationSpeedZ = 1 * trackSpeed / 3;
						endRotationX = -15 * (Math.PI / 180) + Math.PI/2;
						rotationSpeedX = Math.PI/3;
					} else if (stabilizeRotateX) {
						endRotationX = Math.PI/2;
						rotationSpeedX = Math.PI/10;
					} else if (jumpPauseStabilize) {
						endRotationX = Math.PI/2;
						rotationSpeedX = (0.25) * Math.PI;
					}

					endTranslationY = 0;
					translationSpeedY = 0;
					endRotationZ = 0;
					rotationSpeedZ = 0;
					if (leftDamageRotate) {
						endRotationZ = 30 * (Math.PI / 180);
						rotationSpeedZ = Math.PI / 2;
					} else if (rightDamageRotate) {
						endRotationZ = -30 * (Math.PI / 180);
						rotationSpeedZ = Math.PI / 2;
					} else if(stabilizeRotateZ) {
						endRotationZ = 0;
						rotationSpeedZ = Math.PI / 2;
					}
					
					endRotationY = 0;
					rotationSpeedY = 0;
					if (leftTurnRotate) {
						endRotationY = -15 * (Math.PI / 180);
						rotationSpeedY = Math.PI / 2;
					} else if (rightTurnRotate) {
						endRotationY = 15 * (Math.PI / 180);
						rotationSpeedY = Math.PI / 2;
					} else if (stabilizeRotateY) {
						rotationSpeedY = Math.PI / 6;
					}

					currentTimeCharacter = 0;
					totalTimeTranslationX = 0;
					totalTimeTranslationY = 0;
					totalTimeTranslationZ = 0;
					totalTimeRotationX = 0;
					totalTimeRotationY = 0;
					totalTimeRotationZ = 0;
					totalTimePause = 0;
					if (translationSpeedX > 0) {
						totalTimeTranslationX = Math.abs(endTranslationX - startTranslationX) * (1 / translationSpeedX);
					}
					if (translationSpeedY > 0) {
						totalTimeTranslationY = Math.abs(endTranslationY - startTranslationY) * (1 / translationSpeedY);
					}
					if (translationSpeedZ > 0) {
						totalTimeTranslationZ = Math.abs(endTranslationZ - startTranslationZ) * (1 / translationSpeedZ);
					}
					if (rotationSpeedX > 0) {
						totalTimeRotationX = Math.abs(endRotationX - startRotationX) * (1 / rotationSpeedX);
					}
					if (rotationSpeedY > 0) {
						totalTimeRotationY = Math.abs(endRotationY - startRotationY) * (1 / rotationSpeedY);
					}
					if (rotationSpeedZ > 0) {
						totalTimeRotationZ = Math.abs(endRotationZ - startRotationZ) * (1 / rotationSpeedZ);
					}
					
					if (jumpPause) {
						//totalTimePause = 0;
						totalTimePause = 1 / trackSpeed;
					}
					
					maxTimeCharacter = Math.max(totalTimeTranslationX, totalTimeTranslationY, totalTimeTranslationZ, totalTimeRotationX, totalTimeRotationY, totalTimeRotationZ, totalTimePause);
				}

        		var updateCharacterPosition = function() {
        			characterEntity.clearComponent('ScriptComponent');
        			refreshCharacterMovementData();
					characterEntity.setComponent(new ScriptComponent({
		    			run: function (_entity) {
		    				currentTimeCharacter += goo.world.tpf;
		    				var positionX = characterEntity.transformComponent.transform.translation.x;
		    				var positionY = characterEntity.transformComponent.transform.translation.y;
		    				var positionZ = characterEntity.transformComponent.transform.translation.z;
		    				var rotationX = characterEntity.transformComponent.transform.rotation.toAngles().x;
							var rotationY = characterEntity.transformComponent.transform.rotation.toAngles().y;
							var rotationZ = characterEntity.transformComponent.transform.rotation.toAngles().z;
		    				
	    					if (currentTimeCharacter < totalTimeTranslationX) {
	    						var lerpFactor = currentTimeCharacter/totalTimeTranslationX;
	    						var interp = lerpFactor * (startTranslationX - endTranslationX);
	    						positionX = startTranslationX - interp;
	    					}
	    					if (currentTimeCharacter < totalTimeTranslationZ) {
	    						var lerpFactor = currentTimeCharacter/totalTimeTranslationZ;
	    						var interp = lerpFactor * (startTranslationZ - endTranslationZ);
	    						positionZ = startTranslationZ - interp;
	    					} else {
	    						if (jumpAscend) {
	    							jumpAscend = false;
	    							//jumpDescend = true;
	    							jumpPauseStabilize = true;
	    							refreshCharacterMovementData();
	    						} else if (jumpDescend) {
	    							jumpDescend = false;
	    							stabilizeRotateX = true;
	    							refreshCharacterMovementData();
	    						}
	    					}
	    					
	    					if (currentTimeCharacter < totalTimePause) {

	    					} else {
	    						if (jumpPause) {
		    						jumpPause = false;
		    						jumpDescend = true;
		    						refreshCharacterMovementData();
		    					}
	    					}
	    					
	    					if (currentTimeCharacter < totalTimeTranslationY) {
	    						var lerpFactor = currentTimeCharacter/totalTimeTranslationY;
	    						var interp = lerpFactor * (startTranslationY - endTranslationY);
	    						positionY = startTranslationY - interp;
	    					}
	    					if (currentTimeCharacter < totalTimeRotationX) {
	    						var lerpFactor = currentTimeCharacter/totalTimeRotationX;
	    						var interp = lerpFactor * (startRotationX - endRotationX);
	    						rotationX = startRotationX - interp;
	    					} else {
	    						if (stabilizeRotateX) {
	    							stabilizeRotateX = false;
	    						} else if (jumpPauseStabilize) {
		    						jumpPauseStabilize = false;
		    						jumpPause = true;
		    						refreshCharacterMovementData();
		    					}
	    					}
	    					if (currentTimeCharacter < totalTimeRotationZ) {
	    						var lerpFactor = currentTimeCharacter/totalTimeRotationZ;
	    						var interp = lerpFactor * (startRotationZ - endRotationZ);
	    						rotationZ = startRotationZ - interp;
	    					} else {
	    						if (leftDamageRotate) {
		    						leftDamageRotate = false;
		    						rightDamageRotate = true;
		    						refreshCharacterMovementData();
		    					} else if (rightDamageRotate) {
		    						rightDamageRotate = false;
		    						stabilizeRotateZ = true;
		    						refreshCharacterMovementData();
		    					} else if (stabilizeRotateZ) {
		    						stabilizeRotateZ = false;
		    					}
	    					}
	    					if (currentTimeCharacter < totalTimeRotationY) {
	    						var lerpFactor = currentTimeCharacter/totalTimeRotationY;
	    						var interp = lerpFactor * (startRotationY - endRotationY);
	    						rotationY = startRotationY - interp;
	    					} else {
	    						if (leftTurnRotate) {
									leftTurnRotate = false;
									stabilizeRotateY = true;
									refreshCharacterMovementData();
								} else if (rightTurnRotate) {
									rightTurnRotate = false;
									stabilizeRotateY = true;
									refreshCharacterMovementData();
								} else if (stabilizeRotateY) {
									stabilizeRotateY = false;
								}
	    					}
	    					_entity.transformComponent.setTranslation(positionX, positionY, positionZ);
	    					_entity.transformComponent.setRotation(rotationX, rotationY, rotationZ);
	    					if (currentTimeCharacter >= maxTimeCharacter) {
	    						//_entity.transformComponent.setTranslation(endTranslationX, endTranslationY, endTranslationZ);
	    						//_entity.transformComponent.setRotation(endRotationX, endRotationY, endRotationZ);
	    						characterEntity.clearComponent('ScriptComponent');
		    				}
		    			}
		    		}));
				}

				window.onkeydown = function(event) {
					if (event.which === 37) {
						event.preventDefault();
						rightTurnRotate = false;
						if (characterPosition === 0) {
				        	characterPosition = -1;
				        	leftTurnRotate = true;
				        } else if (characterPosition === 1) {
				        	characterPosition = 0;
				        	leftTurnRotate = true;
				        }
				        updateCharacterPosition();
					} else if (event.which === 39) {
						event.preventDefault();
						leftTurnRotate = false;
						if (characterPosition === 0) {
				        	characterPosition = 1;
				        	rightTurnRotate = true;
				        } else if (characterPosition === -1) {
				        	characterPosition = 0;
				        	rightTurnRotate = true;
				        }
				        updateCharacterPosition();
					} else if (event.which === 32) {
						event.preventDefault();
						if (!jumpAscend && !jumpDescend && !jumpPauseStabilize && !jumpPause ) {
							stabilizeRotateX = false;
							jumpAscend = true;
						}
						updateCharacterPosition();
					}
				};

				// Start the rendering loop!
				goo.startGameLoop();

			}).then(null, function(e) {
				// If something goes wrong, 'e' is the error message from the engine.
				alert('Failed to load scene: ' + e);
			});

		}
	}

	init();
});
