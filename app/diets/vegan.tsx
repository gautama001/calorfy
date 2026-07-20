import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';

const KETO_RECIPES = [
  {
    title: 'Keto Chicken Salad',
    image: 'https://source.unsplash.com/featured/?chicken,salad',
  },
  {
    title: 'Zucchini Noodles with Pesto',
    image: 'https://source.unsplash.com/featured/?zucchini,pesto',
  },
  {
    title: 'Cauliflower Rice Bowl',
    image: 'https://source.unsplash.com/featured/?cauliflower,rice',
  },
  {
    title: 'Keto Avocado Toast',
    image: 'https://source.unsplash.com/featured/?avocado,toast',
  },
  {
    title: 'Cheesy Egg Muffins',
    image: 'https://source.unsplash.com/featured/?egg,muffins',
  },
  {
    title: 'Keto Taco Cups',
    image: 'https://source.unsplash.com/featured/?keto,taco',
  },
  {
    title: 'Bacon and Egg Breakfast',
    image: 'https://source.unsplash.com/featured/?bacon,egg',
  },
  {
    title: 'Keto Meatballs',
    image: 'https://source.unsplash.com/featured/?meatballs',
  },
  {
    title: 'Stuffed Peppers',
    image: 'https://source.unsplash.com/featured/?stuffed,peppers',
  },
  {
    title: 'Keto Smoothie',
    image: 'https://source.unsplash.com/featured/?keto,smoothie',
  },
];

export default function KetoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Keto Recipes</Text>
      {KETO_RECIPES.map((recipe, index) => (
        <View key={index} style={styles.card}>
          <Image source={{ uri: recipe.image }} style={styles.image} />
          <Text style={styles.label}>{recipe.title}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 10,
    color: '#333',
  },
});
