"""
Tests pour le service supplier_naming
"""
import pytest
from app.services.supplier_naming import get_supplier_name


class TestSupplierNaming:
    """Tests pour la logique de nommage des fournisseurs"""
    
    def test_attar_pro(self):
        """Test ATTAR PRO"""
        assert get_supplier_name("40B014", "PRO") == "ATTAR PRO"
        assert get_supplier_name("40T171", "PRO") == "ATTAR PRO"
        assert get_supplier_name("40T174", "PRO") == "ATTAR PRO"
        assert get_supplier_name("40T175", "PRO") == "ATTAR PRO"
        assert get_supplier_name("40T176", "PRO") == "ATTAR PRO"
    
    def test_attar(self):
        """Test ATTAR (non-PRO)"""
        assert get_supplier_name("40B014", "N") == "ATTAR"
        assert get_supplier_name("40T171", "") == "ATTAR"
        assert get_supplier_name("40T174", "DUB") == "ATTAR"
    
    def test_lrf_pro(self):
        """Test LRF PRO"""
        assert get_supplier_name("40L068", "PRO") == "LRF PRO"
        assert get_supplier_name("40L069", "PRO") == "LRF PRO"
    
    def test_le_relais_fr_dub(self):
        """Test LE RELAIS FR DUB"""
        assert get_supplier_name("40L068", "DUB") == "LE RELAIS FR DUB"
        assert get_supplier_name("40L069", "DUB") == "LE RELAIS FR DUB"
    
    def test_le_relais_fr(self):
        """Test LE RELAIS FR"""
        assert get_supplier_name("40L068", "N") == "LE RELAIS FR"
        assert get_supplier_name("40L069", "") == "LE RELAIS FR"
    
    def test_eurotex_pro(self):
        """Test EUROTEX PRO"""
        assert get_supplier_name("40E225", "PRO") == "EUROTEX PRO"
    
    def test_eurotex(self):
        """Test EUROTEX"""
        assert get_supplier_name("40E225", "N") == "EUROTEX"
        assert get_supplier_name("40E225", "") == "EUROTEX"
    
    def test_lrm_sbr(self):
        """Test LRM SBR"""
        assert get_supplier_name("40L070", "") == "LRM SBR"
        assert get_supplier_name("40L070", "PRO") == "LRM SBR"
    
    def test_lrm_abr(self):
        """Test LRM ABR"""
        assert get_supplier_name("40L177", "") == "LRM ABR"
        assert get_supplier_name("40L177", "N") == "LRM ABR"
    
    def test_recu_pro(self):
        """Test RECU PRO"""
        assert get_supplier_name("40R106", "PRO") == "RECU PRO"
    
    def test_recutex(self):
        """Test RECUTEX"""
        assert get_supplier_name("40R106", "N") == "RECUTEX"
        assert get_supplier_name("40R106", "") == "RECUTEX"
    
    def test_soex_all(self):
        """Test SOEX ALL"""
        assert get_supplier_name("40S124", "") == "SOEX ALL"
        assert get_supplier_name("40S124", "PRO") == "SOEX ALL"
    
    def test_soex_dub(self):
        """Test SOEX DUB"""
        assert get_supplier_name("40S126", "") == "SOEX DUB"
        assert get_supplier_name("40S126", "N") == "SOEX DUB"
    
    def test_ttr_o(self):
        """Test TTR/O"""
        assert get_supplier_name("40T143", "O") == "TTR/O"
    
    def test_ttr_n(self):
        """Test TTR/N"""
        assert get_supplier_name("40T143", "N") == "TTR/N"
    
    def test_ttr_pro(self):
        """Test TTR/PRO"""
        assert get_supplier_name("40T143", "N-PRO") == "TTR/PRO"
        assert get_supplier_name("40T143", "PRO") == "TTR/PRO"
        assert get_supplier_name("40T143", "O-PRO") == "TTR/PRO"
        assert get_supplier_name("40T143", "T-PRO") == "TTR/PRO"
    
    def test_ttr_t(self):
        """Test TTR/T (default pour 40T143)"""
        assert get_supplier_name("40T143", "") == "TTR/T"
        assert get_supplier_name("40T143", "T") == "TTR/T"
        assert get_supplier_name("40T143", "X") == "TTR/T"
    
    def test_ttr_anciens(self):
        """Test TTR ANCIENS"""
        assert get_supplier_name("40T173", "") == "TTR ANCIENS"
        assert get_supplier_name("40T169", "") == "TTR ANCIENS"
        assert get_supplier_name("40T173", "PRO") == "TTR ANCIENS"
    
    def test_gtex_pro(self):
        """Test G-TEX PRO"""
        assert get_supplier_name("40G243", "PRO") == "G-TEX PRO"
    
    def test_general_tex(self):
        """Test GENERAL-TEX"""
        assert get_supplier_name("40G243", "N") == "GENERAL-TEX"
        assert get_supplier_name("40G243", "") == "GENERAL-TEX"
    
    def test_rimatex_pro(self):
        """Test RIMATEX PRO"""
        assert get_supplier_name("40R244", "PRO") == "RIMATEX PRO"
    
    def test_rimatex_bvba(self):
        """Test RIMATEX BVBA"""
        assert get_supplier_name("40R244", "N") == "RIMATEX BVBA"
        assert get_supplier_name("40R244", "") == "RIMATEX BVBA"
    
    def test_anciens_frns(self):
        """Test ANCIENS FRNS (default)"""
        assert get_supplier_name("40X999", "") == "ANCIENS FRNS"
        assert get_supplier_name("UNKNOWN", "PRO") == "ANCIENS FRNS"
        assert get_supplier_name("", "") == "ANCIENS FRNS"
        assert get_supplier_name(None, None) == "ANCIENS FRNS"
    
    def test_whitespace_handling(self):
        """Test que les espaces sont bien gérés"""
        assert get_supplier_name(" 40B014 ", " PRO ") == "ATTAR PRO"
        assert get_supplier_name("40L070  ", "  ") == "LRM SBR"
