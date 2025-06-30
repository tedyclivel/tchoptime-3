// src/screens/Markets/MarketsScreen.tsx (Version Vérifiée)
/*import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Dimensions,
  Linking,
  ScrollView, // ⭐ Assurez-vous que Linking est importé ici ⭐
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// ⭐ Votre clé API Google Maps Platform ⭐
const GOOGLE_MAPS_API_KEY = "AIzaSyD9_hxiwsPiYIblHV67qUdH2dtOthmCcTo";

interface Market {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm?: string;
  address?: string;
}

const MarketsScreen: React.FC = () => {
  const [location, setLocation] = useState<Geolocation.GeoPosition | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const mapRef = useRef<MapView>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(2);
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      if (status === 'granted') return true;
      Alert.alert('Permission requise', 'TchopTime a besoin d\'accéder à votre localisation pour trouver les marchés. Veuillez l\'autoriser dans les réglages de votre téléphone.');
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de Localisation',
            message: 'TchopTime a besoin d\'accéder à votre position pour trouver les marchés proches.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          Alert.alert('Permission refusée', 'L\'accès à la localisation est nécessaire pour cette fonctionnalité.');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return false;
  };

  const getCurrentLocationAndFetchMarkets = async () => {
    setIsLoadingLocation(true);
    setError(null);
    setMarkets([]);

    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      setIsLoadingLocation(false);
      setError('Permission de localisation non accordée.');
      return;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        setLocation(position);
        setIsLoadingLocation(false);

        const { latitude, longitude } = position.coords;

        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }, 1000);

        const radius = 5000;
        const type = 'supermarket';
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;

        try {
          const response = await fetch(placesUrl);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const fetchedMarkets: Market[] = data.results.map((place: any) => ({
              id: place.place_id,
              name: place.name,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              address: place.vicinity || place.formatted_address,
              distanceKm: calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng),
            }));
            setMarkets(fetchedMarkets);
          } else {
            setMarkets([]);
            Alert.alert("Info", "Aucun supermarché trouvé à proximité.");
          }
        } catch (apiError) {
          console.error("Erreur lors de la recherche de marchés via Places API:", apiError);
          setError("Impossible de charger les marchés proches. Vérifiez votre connexion ou votre clé API.");
          Alert.alert("Erreur", "Problème lors de la recherche de marchés. Réessayez.");
        }

      },
      (geoError) => {
        console.error("Erreur de géolocalisation: ", geoError);
        setIsLoadingLocation(false);
        let errorMessage = 'Impossible d\'obtenir votre position.';
        if (geoError.code === 1) errorMessage = 'Accès à la localisation refusé.';
        if (geoError.code === 2) errorMessage = 'Position indisponible.';
        if (geoError.code === 3) errorMessage = 'Délai d\'attente dépassé pour la localisation.';
        setError(`Erreur de localisation: ${errorMessage}`);
        Alert.alert("Erreur de Localisation", `Impossible d'obtenir votre position: ${errorMessage}.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    getCurrentLocationAndFetchMarkets();
  }, []);

  const renderMarketItem = ({ item }: { item: Market }) => (
    <View style={styles.marketCard}>
      <Icon name="store" size={30} color="#FF6F61" style={styles.marketIcon} />
      <View style={styles.marketInfo}>
        <Text style={styles.marketName}>{item.name}</Text>
        {item.address && <Text style={styles.marketAddress}>{item.address}</Text>}
        <Text style={styles.marketCoords}>Lat: {item.latitude.toFixed(4)}, Lon: {item.longitude.toFixed(4)}</Text>
        {item.distanceKm && <Text style={styles.marketDistance}>Distance: {item.distanceKm} km</Text>}
      </View>
      <TouchableOpacity style={styles.marketDirectionButton} onPress={() => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${item.latitude},${item.longitude}`;
        const label = item.name;
        const url = Platform.select({
          ios: `${scheme}${label}@${latLng}`,
          android: `${scheme}${latLng}(${label})`
        });
        if (url) Linking.openURL(url);
      }}>
        <Icon name="directions" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marchés Proches</Text>
      </View>

      <View style={styles.mapContainer}>
        {isLoadingLocation ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6A5ACD" />
            <Text style={styles.loadingLocationText}>Chargement de la carte et recherche de marchés...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorMapContainer}>
            <Icon name="map-marker-off" size={60} color="#FF6F61" />
            <Text style={styles.errorTextMap}>{error}</Text>
            <TouchableOpacity onPress={getCurrentLocationAndFetchMarkets} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={location ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            } : undefined}
            showsUserLocation={true}
            followsUserLocation={true}
            loadingEnabled={true}
          >
            {markets.map((market) => (
              <Marker
                key={market.id}
                coordinate={{ latitude: market.latitude, longitude: market.longitude }}
                title={market.name}
                description={market.address || market.distanceKm ? `${market.address || ''} (${market.distanceKm} km)` : ''}
                pinColor="#FF6F61"
              />
            ))}
          </MapView>
        )}
      </View>

      {markets.length > 0 && !isLoadingLocation && !error ? (
        <ScrollView style={styles.marketsListScroll} contentContainerStyle={styles.marketsListContent}>
          <Text style={styles.marketsFoundTitle}>Marchés trouvés ({markets.length}) :</Text>
          {markets.map(market => renderMarketItem({ item: market }))}
        </ScrollView>
      ) : !isLoadingLocation && !error && (
        <View style={styles.emptyMarketsContainer}>
          <Text style={styles.emptyMarketsText}>Aucun marché trouvé.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 20,
    paddingBottom: 15,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  mapContainer: {
    width: '100%',
    height: height * 0.5,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLocationText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorMapContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTextMap: {
    fontSize: 18,
    color: '#FF6F61',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6A5ACD',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  marketsListScroll: {
    flex: 1,
    paddingHorizontal: 15,
  },
  marketsListContent: {
    paddingBottom: 20,
  },
  marketsFoundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  marketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  marketIcon: {
    marginRight: 15,
  },
  marketInfo: {
    flex: 1,
  },
  marketName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  marketAddress: {
    fontSize: 14,
    color: '#777',
    marginBottom: 3,
  },
  marketCoords: {
    fontSize: 13,
    color: '#999',
  },
  marketDistance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6A5ACD',
    marginTop: 5,
  },
  marketDirectionButton: {
    backgroundColor: '#FF6F61',
    borderRadius: 20,
    padding: 10,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMarketsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyMarketsText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default MarketsScreen;*/
