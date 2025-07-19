import {
  Alert,
  StyleSheet,
  Text,
  View,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import MapView, { Marker, Callout } from "react-native-maps";



export default function App() {
  const [poiData, setPoiData] = useState([]);

  const mapReference = useRef(null);
  const API_KEY = 'd5d4a47cf65b4c5ebacc5d478b89f0f9';

  const defaultRegion = {
    latitude: 38.6426,
    longitude: -76.3871,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await requestLocationPermission();
      await getCurrentLocation();
    } catch (error) {
      console.log('Error initializing app:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const permissionObject = await Location.requestForegroundPermissionsAsync();

      if (permissionObject.status === "granted") {
        console.log("Permission Granted!");
      } else {
        console.log("Permission Denied!");
        await fetchPOIs(defaultRegion.latitude, defaultRegion.longitude);
      }
    } catch (error) {
      console.log(`Error while requesting permission: ${JSON.stringify(error)}`);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      if (location !== undefined) {
        console.log(`Current Location: ${JSON.stringify(location)}`);
        await fetchPOIs(location.coords.latitude, location.coords.longitude);
        
        const newLocationRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        };

        if (mapReference.current) {
          mapReference.current.animateToRegion(newLocationRegion);
        }
      }
    } catch (error) {
      console.log(`Error while fetching current location: ${error.message}`);
      await fetchPOIs(defaultRegion.latitude, defaultRegion.longitude);
    }
  };

  const fetchPOIs = async (latitude, longitude) => {
    try {
      const url = `https://api.geoapify.com/v2/places?categories=catering,office&conditions=named&filter=circle:${longitude},${latitude},5000&limit=20&apiKey=${API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.features) {
        setPoiData(data.features);
      } else {
        setPoiData([]);
      }
    } catch (error) {
      console.log("Error fetching POIs:", error);
      setPoiData([]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>What's Nearby?</Text>
        <Text style={styles.headerSubtitle}>
          Displaying catering and office near you
        </Text>
        {poiData.length > 0 && (
          <Text style={styles.statusText}>
            Found {poiData.length} places nearby
          </Text>
        )}
      </View>

      <MapView
        initialRegion={defaultRegion}
        style={styles.mapView}
        ref={mapReference}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {poiData.map((poi, index) => {
          const coordinates = poi.geometry.coordinates;
          const properties = poi.properties;
          
          if (!coordinates || coordinates.length < 2) {
            return null;
          }

          return (
            <Marker
              key={index}
              coordinate={{
                latitude: coordinates[1],
                longitude: coordinates[0],
              }}
            >
              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>
                    {properties?.name || 'Unnamed Location'}
                  </Text>
                  <Text style={styles.calloutDescription}>
                    {properties?.address_line2 || properties?.address_line1 || 'Address not available'}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        }).filter(marker => marker !== null)}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    textAlign: "center",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  },
  statusText: {
    fontSize: 12,
    color: "#28a745",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "bold",
  },
  mapView: {
    flex: 1,
    width: "100%",
  },

  calloutContainer: {
    width: 200,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: -10,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 12,
  },
});
