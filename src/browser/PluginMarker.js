


var utils = require('cordova/utils'),
  event = require('cordova-plugin-googlemaps.event'),
  BaseClass = require('cordova-plugin-googlemaps.BaseClass'),
  LatLng = require('cordova-plugin-googlemaps.LatLng');

function PluginMarker(pluginMap) {
  var self = this;
  BaseClass.apply(self);
  Object.defineProperty(self, "pluginMap", {
    value: pluginMap,
    writable: false
  });
  Object.defineProperty(self, "infoWnd", {
    value: null,
    writable: true
  });
}

utils.extend(PluginMarker, BaseClass);

PluginMarker.prototype._create = function(onSuccess, onError, args) {
  var self = this,
    map = self.pluginMap.get('map'),
    markerId = 'marker_' + args[2],
    pluginOptions = args[1];
  self.__create.call(self, markerId, pluginOptions, function(marker, properties) {
    onSuccess(properties);
  });
};

PluginMarker.prototype.__create = function(markerId, pluginOptions, onSuccess) {
  var self = this,
    map = self.pluginMap.get('map');
  var markerOpts = {
    'overlayId': markerId,
    'position': pluginOptions.position,
    'map': map,
    'disableAutoPan': pluginOptions.disableAutoPan === true,
    'draggable': pluginOptions.draggable === true
  };
  var iconSize = null;
  if (pluginOptions.animation) {
    markerOpts.animation = google.maps.Animation[pluginOptions.animation.toUpperCase()];
  }
  if (pluginOptions.icon) {
    var icon = pluginOptions.icon;
    markerOpts.icon = {};
    if (typeof pluginOptions.icon === 'string') {
      // Specifies path or url to icon image
      markerOpts.icon.url = pluginOptions.icon;
    } else if (typeof pluginOptions.icon === 'object') {
      if (Array.isArray(pluginOptions.icon.url)) {
        // Specifies color name or rule
        markerOpts.icon = {
          'path': 'm12 0c-4.4183 2.3685e-15 -8 3.5817-8 8 0 1.421 0.3816 2.75 1.0312 3.906 0.1079 0.192 0.221 0.381 0.3438 0.563l6.625 11.531 6.625-11.531c0.102-0.151 0.19-0.311 0.281-0.469l0.063-0.094c0.649-1.156 1.031-2.485 1.031-3.906 0-4.4183-3.582-8-8-8zm0 4c2.209 0 4 1.7909 4 4 0 2.209-1.791 4-4 4-2.2091 0-4-1.791-4-4 0-2.2091 1.7909-4 4-4z',
          'fillColor': 'rgb(' + pluginOptions.icon.url[0] + ',' + pluginOptions.icon.url[1] + ',' + pluginOptions.icon.url[2] + ')',
          'fillOpacity': pluginOptions.icon.url[3] / 256,
          'scale': 1.3,
          'strokeWeight': 0,
          'anchor': new google.maps.Point(12, 27)
        };
        iconSize = {
          'width': 22,
          'height': 28
        };
      } else {
        markerOpts.icon.url = pluginOptions.icon.url;
        if (pluginOptions.icon.size) {
          markerOpts.icon.scaledSize = new google.maps.Size(icon.size.width, icon.size.height);
          iconSize = icon.size;
        }
      }
    }

    if (icon.anchor) {
      markerOpts.icon.anchor = new google.maps.Point(icon.anchor[0], icon.anchor[1]);
    }
  }
  if (!markerOpts.icon ||
      !markerOpts.icon.url && !markerOpts.icon.path) {
    // default marker
    markerOpts.icon = {
      'path': 'm12 0c-4.4183 2.3685e-15 -8 3.5817-8 8 0 1.421 0.3816 2.75 1.0312 3.906 0.1079 0.192 0.221 0.381 0.3438 0.563l6.625 11.531 6.625-11.531c0.102-0.151 0.19-0.311 0.281-0.469l0.063-0.094c0.649-1.156 1.031-2.485 1.031-3.906 0-4.4183-3.582-8-8-8zm0 4c2.209 0 4 1.7909 4 4 0 2.209-1.791 4-4 4-2.2091 0-4-1.791-4-4 0-2.2091 1.7909-4 4-4z',
      'fillColor': 'rgb(255, 0, 0)',
      'fillOpacity': 1,
      'scale': 1.3,
      'strokeWeight': 0,
      'anchor': new google.maps.Point(12, 27)
    };
    iconSize = {
      'width': 22,
      'height': 28
    };
  }
  markerOpts.optimized = true;
  var marker = new google.maps.Marker(markerOpts);
  marker.addListener('click', self.onMarkerClickEvent.bind(self, event.MARKER_CLICK, marker), {passive: true});
  marker.addListener('dragstart', self.onMarkerEvent.bind(self, event.MARKER_DRAG_START, marker));
  marker.addListener('drag', self.onMarkerEvent.bind(self, event.MARKER_DRAG, marker));
  marker.addListener('dragend', self.onMarkerEvent.bind(self, event.MARKER_DRAG_END, marker));

  if (pluginOptions.title) {
    marker.set('title', pluginOptions.title);
  }
  if (pluginOptions.snippet) {
    marker.set('snippet', pluginOptions.snippet);
  }


  self.pluginMap.objects[markerId] = marker;
  self.pluginMap.objects['marker_property_' + markerId] = markerOpts;

  if (iconSize) {
    onSuccess(marker, {
      'id': markerId,
      'width': iconSize.width,
      'height': iconSize.height
    });
  } else {
    var markerIcon = marker.getIcon();
    if (markerIcon && markerIcon.size) {
      onSuccess({
        'id': markerId,
        'width': markerIcon.size.width,
        'height': markerIcon.size.height
      });
    } else {
      var img = new Image();
      img.onload = function() {
        onSuccess(marker, {
          'id': markerId,
          'width': img.width,
          'height': img.height
        });
      };
      img.onerror = function() {
        onSuccess(marker, {
          'id': markerId,
          'width': 20,
          'height': 42
        });
      };
      if (typeof markerOpts.icon === "string") {
        img.src = markerOpts.icon;
      } else {
        img.src = markerOpts.icon.url;
      }
    }
  }

  setTimeout(function() {
    marker.setAnimation(null);
  }, 500);
};
PluginMarker.prototype._removeMarker = function(marker) {
  marker.setMap(null);
  marker = undefined;
};

PluginMarker.prototype.setRotation = function(onSuccess, onError, args) {
  var self = this;
  var overlayId = args[0];
  var rotation = args[1];
  var marker = self.pluginMap.objects[overlayId];
  if (marker) {
    var icon = marker.getIcon();
    if (icon && icon.path) {
      icon.rotation = rotation;
      marker.setIcon(icon);
    }
  }
  onSuccess();
};
PluginMarker.prototype.setTitle = function(onSuccess, onError, args) {
  var self = this;
  var overlayId = args[0];
  var title = args[1];
  var marker = self.pluginMap.objects[overlayId];
  marker.set('title', title);
  onSuccess();
};

PluginMarker.prototype.setSnippet = function(onSuccess, onError, args) {
  var self = this;
  var overlayId = args[0];
  var title = args[1];
  var marker = self.pluginMap.objects[overlayId];
  marker.set('snippet', title);
  onSuccess();
};

PluginMarker.prototype.showInfoWindow = function(onSuccess, onError, args) {
  var self = this;
  var overlayId = args[0];
  var marker = self.pluginMap.objects[overlayId];
  if (marker) {
    self.pluginMap.activeMarker = marker;
    self._showInfoWindow.call(self, marker);
  }
  onSuccess();
};
PluginMarker.prototype.hideInfoWindow = function(onSuccess, onError, args) {
  var self = this;
  var overlayId = args[0];
  if (self.infoWnd) {
    self.infoWnd.close();
    self.infoWnd = null;
  }
  onSuccess();
};
PluginMarker.prototype.setIcon = function(onSuccess, onError, args) {
  var self = this;
  var overlayId = args[0];
  var marker = self.pluginMap.objects[overlayId];

  self.setIcon_(marker, args[1])
    .then(onSuccess)
    .catch(onError);
};
PluginMarker.prototype.setIcon_ = function(marker, iconOpts) {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (marker) {
      if (Array.isArray(iconOpts)) {
        // Specifies color name or rule
        iconOpts = {
          'path': 'm12 0c-4.4183 2.3685e-15 -8 3.5817-8 8 0 1.421 0.3816 2.75 1.0312 3.906 0.1079 0.192 0.221 0.381 0.3438 0.563l6.625 11.531 6.625-11.531c0.102-0.151 0.19-0.311 0.281-0.469l0.063-0.094c0.649-1.156 1.031-2.485 1.031-3.906 0-4.4183-3.582-8-8-8zm0 4c2.209 0 4 1.7909 4 4 0 2.209-1.791 4-4 4-2.2091 0-4-1.791-4-4 0-2.2091 1.7909-4 4-4z',
          'fillColor': 'rgb(' + iconOpts[0] + ',' + iconOpts[1] + ',' + iconOpts[2] + ')',
          'fillOpacity': iconOpts[3] / 256,
          'scale': 1.3,
          'strokeWeight': 0,
          'anchor': new google.maps.Point(12, 27)
        };
      } else if (typeof iconOpts === "object") {

        if (typeof iconOpts.size === "object") {
          iconOpts.size = new google.maps.Size(iconOpts.size.width, iconOpts.size.height, 'px', 'px');
          iconOpts.scaledSize = iconOpts.size;
        }
      }

      marker.setIcon(iconOpts);
    }
    resolve();
  });
};
PluginMarker.prototype.setPosition = function(onSuccess, onError, args) {
  var self = this;
  var overlayId = args[0];
  var marker = self.pluginMap.objects[overlayId];
  if (marker) {
    marker.setPosition({'lat': args[1], 'lng': args[2]});
  }
  onSuccess();
};

PluginMarker.prototype.remove = function(onSuccess, onError, args) {
  var self = this;
  var overlayId = args[0];
  var marker = self.pluginMap.objects[overlayId];
  if (marker) {
    google.maps.event.clearInstanceListeners(marker);
    marker.setMap(null);
    marker = undefined;
    self.pluginMap.objects[overlayId] = undefined;
    delete self.pluginMap.objects[overlayId];
  }
  onSuccess();
};

PluginMarker.prototype.onMarkerEvent = function(evtName, marker) {
  var self = this,
    mapId = self.pluginMap.id;

  if (mapId in plugin.google.maps) {
    var latLng = marker.getPosition();
    plugin.google.maps[mapId]({
      'evtName': evtName,
      'callback': '_onMarkerEvent',
      'args': [marker.overlayId, new LatLng(latLng.lat(), latLng.lng())]
    });
  }

};

PluginMarker.prototype._showInfoWindow = function(marker) {
  var self = this;
  if (!self.infoWnd) {
    self.infoWnd = new google.maps.InfoWindow();
  }
  self.pluginMap.activeMarker = marker;
  self.pluginMap._syncInfoWndPosition.call(self);
  var maxWidth = marker.getMap().getDiv().offsetWidth * 0.7;
  var html = [];
  if (marker.get("title")) {
    html.push(marker.get("title"));
  }
  if (marker.get("snippet")) {
    html.push('<small>' + marker.get("snippet") + '</small>');
  }
  if (html.length > 0) {
    self.infoWnd.setOptions({
      content: html.join('<br>'),
      disableAutoPan: marker.disableAutoPan,
      maxWidth: maxWidth
    });
    self.infoWnd.open(marker.getMap(), marker);
  }
};

PluginMarker.prototype.onMarkerClickEvent = function(evtName, marker) {
  var self = this;

  var overlayId = marker.get("overlayId");
  if (overlayId.indexOf("markercluster_") > -1) {
    if (overlayId.indexOf("-marker_") > -1) {
      self.pluginMap.activeMarker = marker;
      self.onClusterEvent(event.MARKER_CLICK, marker);
    } else {
      if (activeMarker != null) {
        self.onMarkerEvent(event.INFO_CLOSE, marker);
      } else {
        self._showInfoWindow(marker);
      }
    }
    self.onClusterEvent("cluster_click", marker);
  } else {
    self.onMarkerEvent(event.MARKER_CLICK, marker);
  }

};

PluginMarker.prototype.onClusterEvent = function(evtName, marker) {

  var self = this,
    mapId = self.pluginMap.id;

  var overlayId = marker.get("overlayId");
  var tmp = overlayId.split("-");
  var clusterId = tmp[0];
  var markerId = tmp[1];
  var latLng = marker.getPosition();
  if (mapId in plugin.google.maps) {
    plugin.google.maps[mapId]({
      'evtName': evtName,
      'callback': '_onClusterEvent',
      'args': [clusterId, markerId, new LatLng(latLng.lat(), latLng.lng())]
    });
  }
};

module.exports = PluginMarker;
