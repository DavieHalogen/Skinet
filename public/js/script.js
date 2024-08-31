function selectPackage(packageName,PackagePrice) {
    window.location.href = `combined.html?package=${encodeURIComponent(packageName)}&price=${encodeURIComponent(PackagePrice)}`;
}
