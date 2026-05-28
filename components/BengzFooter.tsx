import { StyleSheet, View, Image } from "react-native";
import React from "react";

const BENGZ_LOGO_URL = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/b7crxabkaj410jchfke1o.png";

function BengzFooter() {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: BENGZ_LOGO_URL }}
        style={styles.logo}
        resizeMode="contain"
        tintColor="#FFFFFF"
      />
    </View>
  );
}

export default React.memo(BengzFooter);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
    paddingBottom: 8,
  },
  logo: {
    width: 80,
    height: 32,
    opacity: 0.5,
  },
});
