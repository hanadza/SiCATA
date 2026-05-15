// Daftar Kelurahan/Desa di KOTA Tasikmalaya
// 10 Kecamatan, 69 Kelurahan/Desa

const KECAMATAN_DESA = {
  "Bungursari": ["Bantarsari","Bungursari","Cibunigeulis","Sukajaya","Sukalaksana","Sukamulya","Sukarindik"],
  "Cibeureum":  ["Awipari","Ciakar","Ciherang","Kersanagara","Kotabaru","Margabakti","Setiajaya","Setianegara","Setiaratu"],
  "Cihideung":  ["Argasari","Cilembang","Nagarawangi","Tugujaya","Tuguraja","Yudanagara"],
  "Cipedes":    ["Cipedes","Nagarasari","Panglayungan","Sukamanah"],
  "Indihiang":  ["Indihiang","Parakannyasag","Sirnagalih","Sukamaju Kaler","Sukamaju Kidul","Sukarindik"],
  "Kawalu":     ["Cibeuti","Cilamajang","Gununggede","Gunungtandala","Karanganyar","Karsamenak","Leuwiliang","Talagasari","Tanjung","Urug"],
  "Mangkubumi": ["Cipari","Karikil","Linggajaya","Mangkubumi","Sambongjaya","Sukamantri","Sukapura","Setiawargi"],
  "Purbaratu":  ["Purbaratu","Singkup","Sukaasih","Sukajaya","Sukamenak","Sukalaksana"],
  "Tamansari":  ["Mulyasari","Setiamulya","Sumelap","Tamansari","Tamanjaya","Mugarsari","Sambongpari","Setiaasih"],
  "Tawang":     ["Cikalang","Empangsari","Kahuripan","Lengkongsari","Tawangsari"]
};

// Flat sorted list for backward compat
const DESA_TASIKMALAYA = Object.values(KECAMATAN_DESA).flat().sort();

