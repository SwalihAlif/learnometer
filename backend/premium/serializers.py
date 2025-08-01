# serializers.py
from rest_framework import serializers
from .models import Wallet, WalletTransaction
from .models import LearnerPremiumSubscription, ReferralEarning, ReferralCode
from django.contrib.auth import get_user_model

User = get_user_model()

class PremiumSubscriptionSerializer(serializers.ModelSerializer):
    learner = serializers.SerializerMethodField()
    referred_by = serializers.SerializerMethodField()
    referral_code = serializers.SerializerMethodField()
    learner_email = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = LearnerPremiumSubscription
        fields = [
            'learner',
            'learner_email',
            'created_at',
            'referred_by',
            'referral_code',
            'status',
        ]

    def get_learner(self, obj):
        return obj.user.get_full_name()

    def get_referral_code(self, obj):
        code = getattr(obj.user, 'referral_code', None)
        return code.code if code else None

    def get_referred_by(self, obj):
        referral = ReferralEarning.objects.filter(referred_user=obj.user).first()
        if referral:
            return referral.referrer.get_full_name() or referral.referrer.email
        return None

    def get_learner_email(self, obj):
        return obj.user.email

    def get_status(self, obj):
        return "Transferred" if obj.is_active else "Inactive"


class ReferralEarningSerializer(serializers.ModelSerializer):
    referrer = serializers.SerializerMethodField()
    referred = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = ReferralEarning
        fields = [
            'referrer',
            'referred',
            'amount',
            'created_at',
            'status'
        ]

    def get_referrer(self, obj):
        return obj.referrer.get_full_name() or obj.referrer.email

    def get_referred(self, obj):
        return obj.referred_user.get_full_name() or obj.referred_user.email

    def get_status(self, obj):
        return "Transferred"


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['wallet_type', 'balance', 'currency', 'updated_at']



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

