(function(window, document) {
  // Pastikan Mapbox GL JS telah tersedia
  if (typeof mapboxgl === 'undefined') {
    console.error('Mapbox GL JS tidak ditemukan. Pastikan library Mapbox GL JS sudah disertakan.');
    return;
  }
  
  var MapLocationPicker = {
    /**
     * Menampilkan modal pemilih lokasi.
     * @param {Object} options - Opsi konfigurasi.
     * @param {string} options.mapboxAccessToken - Mapbox access token (wajib).
     * @param {Object} [options.defaultLocation] - Koordinat default { lng: Number, lat: Number }.
     * @returns {Promise} - Promise yang akan resolve dengan koordinat terpilih.
     */
    showModal: function(options) {
      return new Promise(function(resolve, reject) {
        // Validasi parameter
        if (!options || !options.mapboxAccessToken) {
          reject(new Error('mapboxAccessToken harus disediakan dalam options.'));
          return;
        }
        var defaultLocation = options.defaultLocation || { lng: 106.816666, lat: -6.200000 };

        // Set token Mapbox
        mapboxgl.accessToken = options.mapboxAccessToken;

        // Sisipkan style khusus library (hanya sekali)
        if (!document.getElementById('mlp-styles')) {
          var style = document.createElement('style');
          style.id = 'mlp-styles';
          style.innerHTML =
            "/* Modal container */" +
            ".mlp-modal { display: block; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); }" +
            "/* Modal content */" +
            ".mlp-modal-content { background-color: #fff; margin: 5% auto; width: 90%; max-width: 600px; border-radius: 10px; overflow: hidden; position: relative; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }" +
            "/* Modal header & footer */" +
            ".mlp-modal-header, .mlp-modal-footer { padding: 10px 15px; background-color: #f2f2f2; }" +
            ".mlp-modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; }" +
            ".mlp-modal-footer { border-top: 1px solid #ddd; text-align: right; }" +
            ".mlp-modal-body { padding: 0; }" +
            "/* Map container dan map */" +
            ".mlp-map-container { position: relative; width: 100%; height: 400px; }" +
            ".mlp-map { width: 100%; height: 100%; }" +
            "/* Hint di bagian bawah peta */" +
            ".mlp-map-hint { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.8); padding: 5px 10px; border-radius: 5px; font-size: 14px; color: #333; }" +
            "/* Tombol tutup modal */" +
            ".mlp-close { font-size: 28px; font-weight: bold; cursor: pointer; color: #aaa; }" +
            ".mlp-close:hover, .mlp-close:focus { color: #000; }" +
            "/* Tombol simpan lokasi */" +
            "#mlp-save { padding: 8px 16px; font-size: 16px; cursor: pointer; background-color: #28a745; border: none; color: #fff; border-radius: 5px; transition: background-color 0.3s ease; }" +
            "#mlp-save:hover { background-color: #218838; }";
          document.head.appendChild(style);
        }

        // Buat elemen modal
        var modal = document.createElement('div');
        modal.className = 'mlp-modal';
        modal.id = 'mlp-modal';

        // Buat konten modal
        var modalContent = document.createElement('div');
        modalContent.className = 'mlp-modal-content';

        // Header modal
        var modalHeader = document.createElement('div');
        modalHeader.className = 'mlp-modal-header';
        modalHeader.innerHTML = '<h2>Pilih Lokasi</h2><span class="mlp-close" id="mlp-close">&times;</span>';

        // Body modal
        var modalBody = document.createElement('div');
        modalBody.className = 'mlp-modal-body';
        var mapContainer = document.createElement('div');
        mapContainer.className = 'mlp-map-container';
        var mapDiv = document.createElement('div');
        mapDiv.id = 'mlp-map';
        mapDiv.className = 'mlp-map';
        var mapHint = document.createElement('div');
        mapHint.className = 'mlp-map-hint';
        mapHint.innerText = 'Klik di peta atau geser marker untuk memilih lokasi';
        mapContainer.appendChild(mapDiv);
        mapContainer.appendChild(mapHint);
        modalBody.appendChild(mapContainer);

        // Footer modal
        var modalFooter = document.createElement('div');
        modalFooter.className = 'mlp-modal-footer';
        var saveButton = document.createElement('button');
        saveButton.id = 'mlp-save';
        saveButton.innerText = 'Simpan Lokasi';
        modalFooter.appendChild(saveButton);

        // Gabungkan bagian-bagian modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Variabel untuk map, marker, dan koordinat terpilih
        var map, marker;
        var selectedCoords = defaultLocation; // Koordinat awal

        // Inisialisasi Mapbox map
        map = new mapboxgl.Map({
          container: 'mlp-map',
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [defaultLocation.lng, defaultLocation.lat],
          zoom: 12
        });

        // Tambahkan marker yang bisa digeser
        marker = new mapboxgl.Marker({ draggable: true })
          .setLngLat([defaultLocation.lng, defaultLocation.lat])
          .addTo(map);

        // Update koordinat saat marker diseret
        marker.on('dragend', function() {
          selectedCoords = marker.getLngLat();
        });

        // Update posisi marker dan koordinat saat peta diklik
        map.on('click', function(e) {
          marker.setLngLat(e.lngLat);
          selectedCoords = e.lngLat;
        });

        // Fungsi untuk membersihkan modal dan instance map
        function cleanup() {
          if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
          if (map) {
            map.remove();
          }
        }

        // Event listener tombol tutup modal
        var closeBtn = document.getElementById('mlp-close');
        closeBtn.addEventListener('click', function() {
          cleanup();
          reject(new Error('Modal ditutup tanpa menyimpan'));
        });

        // Tutup modal jika klik di luar konten modal
        modal.addEventListener('click', function(e) {
          if (e.target === modal) {
            cleanup();
            reject(new Error('Modal ditutup tanpa menyimpan'));
          }
        });

        // Event listener tombol simpan lokasi
        saveButton.addEventListener('click', function() {
          cleanup();
          resolve(selectedCoords);
        });
      });
    }
  };

  // Ekspor library ke ruang lingkup global
  window.MapLocationPicker = MapLocationPicker;
})(window, document);
