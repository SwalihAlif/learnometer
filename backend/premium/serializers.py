# serializers.py
from rest_framework import serializers
from .models import Wallet, WalletTransaction

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['wallet_type', 'balance', 'currency', 'updated_at']


# serializers.py
class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            'id',
            'amount',
            'transaction_type',
            'current_balance',
            'source_id',
            'description',
            'timestamp',
        ]

