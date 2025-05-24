import { pointsCollection } from "../js/points.js"

function turfFunctions(map) {
	
	console.log("message")
	alert("Welcome!")

	// define point coordinates
	const pointCoords = [26.71552, 58.37393] //Koordinaadid peavad olema niipidi! Ehk Turfis pikkus enne.
	// define a point
	const myPoint = turf.point(pointCoords)
	// convert the point to geoJSON object
	const geoJSON_point = L.geoJSON(myPoint)
	// add the geoJSON object to the map
	geoJSON_point.addTo(map)

	// define line coordinates
	const lineCoords = [
	[26.71379, 58.37476],
	[26.71554, 58.37349],
	[26.71553, 58.37434],
	[26.71630, 58.37378],
	[26.71473, 58.37407]
  ]
  // define the line object
  	const myLine = turf.lineString(lineCoords)
  	// convert the line to geoJSON object
	const geoJSON_line = L.geoJSON(myLine)
	// add the geoJSON object to the map
	geoJSON_line.addTo(map)

	// define polygon coordinates
	const polygonCoords = [[
		[26.71355, 58.37468],
		[26.71404, 58.37430],
		[26.71433, 58.37429],
		[26.71550, 58.37345],
		[26.71660, 58.37388],
		[26.71615, 58.37420],
		[26.71589, 58.37431],
		[26.71552, 58.37461],
		[26.71521, 58.37496],
		[26.71480, 58.37481],
		[26.71449, 58.37502],
		[26.71355, 58.37468]
	]]
  	// define polygon object
  	const myPolygon = turf.polygon(polygonCoords)
	// convert the polygon to geoJSON object
	const geoJSON_polygon = L.geoJSON(myPolygon)
	// add the geoJSON object to the map
	geoJSON_polygon.addTo(map)

	// define point coordinates
	const pointCoords2 = [26.71489, 58.37439] //Koordinaadid peavad olema niipidi! Ehk Turfis pikkus enne.
	// define a point
	const myPoint2 = turf.point(pointCoords2)
	// convert the point to geoJSON object
	const geoJSON_point2 = L.geoJSON(myPoint2)
	// add the geoJSON object to the map
	geoJSON_point2.addTo(map)

	// define point coordinates
	const pointCoordsOutside = [26.71216, 58.37428] //Koordinaadid peavad olema niipidi! Ehk Turfis pikkus enne.
	// define a point
	const myPointOutside = turf.point(pointCoordsOutside)
	// convert the point to geoJSON object
	const geoJSON_pointOutside = L.geoJSON(myPointOutside)
	// add the geoJSON object to the map
	geoJSON_pointOutside.addTo(map)



	const options = { units: 'meters' }

	// replace point1 and point2 with the actual names you used to define your Turf points
	const distance = turf.distance(myPoint, myPoint2, options)
	/* console.log(`distance is ${distance} meters`) */

	// round the distance to nearest integer
	const distanceRounded = Math.round(distance)
	// distance is first multiplied by 100, then rounded and divided by 100 to keep two digits after the decimal point
	const roundedToTwoDecimals = Math.round(distance*100)/100
	// compare the results
	/* console.log(`rounded to nearest integer: ${distanceRounded}`)
	console.log(`rounded to two decimal points: ${roundedToTwoDecimals}`) */

	const areaMeasurement = turf.area(myPolygon)
	const areaRounded = Math.round(areaMeasurement)
	console.log(`Area without rounding: ${areaMeasurement}`)
	console.log(`Rounded area is ${areaRounded} square meters`)

	/* const statueBuffer = turf.buffer(myPoint, 20, {units: 'meters'})
	L.geoJSON(statueBuffer).addTo(map)

	const lineBuffer = turf.buffer(myLine, 20, {units: 'meters'})
	L.geoJSON(lineBuffer).addTo(map)

	const parkBuffer = turf.buffer(myPolygon, 20, {units: 'meters'})
	L.geoJSON(parkBuffer).addTo(map) */

	// create a feature collection
	const features = turf.featureCollection([myPoint, myPointOutside, myLine, myPolygon])
	// create the envelope
	const enveloped = turf.envelope(features)
	// add to map
	L.geoJSON(enveloped).addTo(map)

	const points = turf.points(pointsCollection)
	/* L.geoJSON(points).addTo(map) */

	const pointsWithinBorders = turf.pointsWithinPolygon(points, myPolygon)
	// this should log an object that contains all the features within the park polygon
	console.log(pointsWithinBorders)

	L.geoJSON(pointsWithinBorders).addTo(map)

	const poly1234 = turf.polygon([
  [
		[26.71355, 58.37468],
		[26.71455, 58.37568],
		[26.71465, 58.37430],
		[26.71565, 58.37530],
		[26.71660, 58.37565],
		[26.71675, 58.37580],
		[26.71689, 58.37594],
		[26.71589, 58.37494],
		[26.71529, 58.37434],
		[26.71429, 58.37381],
		[26.71399, 58.37351],
		[26.71355, 58.37468]
  ]
]);

	const triangles = turf.tesselate(poly1234);

	const trianglesLayer = L.geoJSON(triangles, {
    	style: {
        	color: 'red',        // outline color
    		fillColor: 'red',    // fill color
    		fillOpacity: 0.5     // adjust transparency as needed
  		}
	});
        
	trianglesLayer.addTo(map);
	
}

export {turfFunctions}