NPO_map
=======

Mapping Zoning/Planning Data for Newark/NJ

12-06-2014 Updated tasks

I have split the tasks in order of priority:

I. Geosearch

Address search bar to be added to map. Limit query to street address string? See viewport biasing in Google API. Panning and zooming is built into all geosearches I have seen. If time allows, it would be neat to log the returned geometry point (where the marker falls) and use it to trigger an infowindow opening or to apply a new style to the relevant data  (e.g. ST_intersects).

Documentation: L.geosearch, Google Geocoding API

Example: Urbanreviewer, BingGeocoder

II. Basemap Toggle
	
A button to toggle between current basemap and satellite imagery basemap. Control with Z-index.

Documentation: cartodb.js, L.control.layers

Example: PortlandNeighborhoods 
 
III. Reference Layer
	
The reference layer, or labels layer, has the highest z-index. It allows all or some labels to always be readable 
over data layers. Mapbox Studio? This can probably wait until all other tasks are completed. 
	
Documentation: CartoCSS

Example: BurlingtonZoning
	
