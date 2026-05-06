// Daftar Desa/Kelurahan se-Kabupaten dan Kota Tasikmalaya
const DESA_TASIKMALAYA = [
  // Kabupaten Tasikmalaya - Kecamatan Ciawi
  "Ciawi","Cibeber","Cisarua","Kertamukti","Kurniabakti","Mekarwangi","Pakemitan","Pakemitan Kidul","Tanjungsari","Sukawening",
  // Kecamatan Cigalontang
  "Cigalontang","Tanjungkarang","Tanjungkarang Utara","Cimanggu","Cibuniasih","Sukaratu","Linggajati","Neglasari","Pusparahayu","Sariwangi","Margamulya","Mekarsari",
  // Kecamatan Cikatomas
  "Cikatomas","Cikubang","Cikuya","Hanjuang","Iklanjaya","Linggamulya","Margajaya","Mekarjaya","Sangiang","Sukajaya",
  // Kecamatan Cipatujah
  "Cipatujah","Cikawungading","Cikupa","Darawati","Kertaharja","Nagrog","Padawaras","Sindangkerta","Toblong","Yerserang",
  // Kecamatan Cisayong
  "Cisayong","Cikaret","Cileuleus","Cidugaleun","Girimukti","Jayagiri","Mekarjaya","Neglasari","Pasirmukti","Sukajadi","Sukaraharja",
  // Kecamatan Culamega
  "Culamega","Bantarkalong","Cibuluh","Neglasari","Pamoyanan","Sukasari",
  // Kecamatan Gunungtanjung
  "Gunungtanjung","Cilangkap","Ciwulan","Gunung Sari","Kertasari","Linggamukti","Mekarwangi","Sukarasa",
  // Kecamatan Jamanis
  "Jamanis","Dangdeur","Kiarajangkung","Mekarjaya","Neglasari","Pagerageung","Sukahurip","Sukaluyu",
  // Kecamatan Jatiwaras
  "Jatiwaras","Buniasih","Ciwarak","Kalimanggis","Karangmulyan","Neglasari","Papayan","Setiawangi","Sukaratu","Sukaratu Kidul",
  // Kecamatan Kadipaten
  "Kadipaten","Banjarwaringin","Cibungur","Cibuniasih","Neglasari","Pamijahan","Sukamulya","Tanjungjaya",
  // Kecamatan Karangnunggal
  "Karangnunggal","Cikalong","Cimanuk","Cintajaya","Kujang","Linggasirna","Mekarsari","Pamulihan","Pasirgalam","Sarimukti","Sukaharja",
  // Kecamatan Leuwisari
  "Leuwisari","Arjasari","Cigaleuh","Cigugur","Margaluyu","Neglasari","Sepatnunggal","Sinagar",
  // Kecamatan Mangunreja
  "Mangunreja","Cibeureum","Cibeuti","Sukahurip","Sukaraharja","Sukasari","Sukaratu",
  // Kecamatan Manonjaya
  "Manonjaya","Ancol","Batubini","Cibeber","Cilangla","Citangtu","Pasirpanjang","Sarimukti","Sumberjaya",
  // Kecamatan Padakembang
  "Padakembang","Sukahurip","Sukajaya","Sukamantri","Sukarame","Sukasari","Sukatani","Sukawangi",
  // Kecamatan Pagerageung
  "Pagerageung","Bangbayang","Ciawi","Cinagara","Gunung Sari","Kertajaya","Sukahurip","Sukakarsa",
  // Kecamatan Parungponteng
  "Parungponteng","Bojongkapol","Cimulya","Kersagalih","Nagrog","Nanggewer","Pasirhalang",
  // Kecamatan Rajapolah
  "Rajapolah","Cileuleus","Mangguang","Mangkubumi","Nusawangi","Sukaratu","Tanjungpura",
  // Kecamatan Salawu
  "Salawu","Cikadu","Cikadongdong","Gunung Sari","Jayaputra","Kertanagara","Leuwidulang","Margaluyu","Sukahurip","Sukaratu",
  // Kecamatan Salopa
  "Salopa","Cibongas","Cidulang","Karyamukti","Kiarajangkung","Neglasari","Sepatnunggal",
  // Kecamatan Singaparna
  "Singaparna","Cipakat","Cikunten","Cintaraja","Gunung Tanggung","Linggajati","Neglasari","Sukaasih","Sukamaju","Sukarame",
  // Kecamatan Sodonghilir
  "Sodonghilir","Bantarkalong","Ciawi","Cibuniasih","Cikupa","Neglasari","Pamoyanan","Tanjungsari","Toblong",
  // Kecamatan Sukahening
  "Sukahening","Cidadap","Cilolohan","Girimulya","Kersagalih","Margasari","Sukamenak",
  // Kecamatan Sukarame
  "Sukarame","Beber","Cibeber","Kersanagara","Mekarwangi","Padamulya","Tanjungsari",
  // Kecamatan Sukaraja
  "Sukaraja","Cidugaleun","Cikadu","Cikaret","Cikunten","Gunung Sari","Sukagalih","Sukamanah","Sukamantri",
  // Kecamatan Sukaratu
  "Sukaratu Kab","Beber","Ciharashas","Cikunten","Linggajati","Mekarjaya","Neglasari","Sukaratu",
  // Kecamatan Taraju
  "Taraju","Bantarkalong","Cikupa","Cirahayu","Neglasari","Sukamaju","Sukasetia","Tanjungsari",
  // Kota Tasikmalaya - Kecamatan Bungursari
  "Bungursari","Bantarsari","Cibunigeulis","Cipawitra","Sukajaya Kota","Sukalaksana","Sukarindik",
  // Kecamatan Cibeureum
  "Cibeureum","Awipari","Ciherang","Citapen","Kersanagara","Margabakti","Setiawargi",
  // Kecamatan Cihideung
  "Cihideung","Argasari","Cilembang","Cilamajang","Tuguraja","Yudanagara",
  // Kecamatan Cipedes
  "Cipedes","Nagarasari","Panglayungan","Sukamanah Kota",
  // Kecamatan Indihiang
  "Indihiang","Benda","Kahuripan","Panyingkiran","Sirnagalih","Sukamajukaler","Sukamajukulon",
  // Kecamatan Kawalu
  "Kawalu","Cilamajang","Gunungtandala","Karanganyar","Karsamenak","Leuwiliang","Talagasari","Tanjung",
  // Kecamatan Mangkubumi
  "Mangkubumi","Cipari","Karikil","Linggajaya","Pegantungan","Sambongjaya","Sambongpari",
  // Kecamatan Purbaratu
  "Purbaratu","Bungursari","Ciherang","Singkup","Sukaasih Kota","Sukajaya Purbaratu",
  // Kecamatan Tamansari
  "Tamansari","Mugarsari","Setiawargi","Sumelap","Tamanjaya","Urug",
  // Kecamatan Tawang
  "Tawang","Kahuripan Kota","Lengkongsari","Empangsari","Setiajaya"
].sort();
