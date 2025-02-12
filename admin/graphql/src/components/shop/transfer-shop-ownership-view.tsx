import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Loader from '@/components/ui/loader/loader';
import {
  useModalAction,
  useModalState,
} from '@/components/ui/modal/modal.context';
import SelectInput from '@/components/ui/select-input';
import TextArea from '@/components/ui/text-area';
import Title from '@/components/ui/title';
import { useTransferShopOwnershipMutation } from '@/graphql/shops.graphql';
import { useUsersByPermissionQuery } from '@/graphql/user.graphql';
import { STORE_OWNER } from '@/utils/constants';
import { User } from '__generated__/__types__';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormValues {
  vendor: User;
  message: string;
}

const TransferShopOwnershipView = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useTranslation('common');
  const {
    data: { owner_id, id },
  } = useModalState();

  const {
    data,
    loading: vendorLoading,
    error: vendorError,
    refetch,
  } = useUsersByPermissionQuery({
    variables: {
      is_active: true,
      exclude: owner_id,
      permission: STORE_OWNER,
    },
  });

  const { handleSubmit, control, register, watch } = useForm<FormValues>();
  const { closeModal } = useModalAction();

  const [transferShopOwnershipMutation, { loading: isLoading, error }] =
    useTransferShopOwnershipMutation({
      onCompleted: () => {
        closeModal();
      },
    });

  async function handleUpdateTransferRequest({ vendor, message }: FormValues) {
    transferShopOwnershipMutation({
      variables: {
        input: {
          shop_id: id as string,
          vendor_id: vendor?.id,
          message: message,
        },
      },
    });
  }
  const vendor = watch('vendor');
  return (
    <div className="m-auto flex w-full max-w-sm flex-col rounded bg-light p-5 sm:w-[24rem]">
      {vendorLoading ? (
        <Loader text={t('common:text-loading')} className="!h-auto py-20" />
      ) : errorMessage ? (
        <Alert
          message={t(`common:${errorMessage}`)}
          variant="error"
          closeable={true}
          className="mt-5"
          onClose={() => setErrorMessage(null)}
        />
      ) : (
        <form onSubmit={handleSubmit(handleUpdateTransferRequest)} noValidate>
          <Title className="mb-5 text-lg font-semibold">
            {t('text-transfer-shop-ownership')}
          </Title>
          <div className="space-y-5">
            <SelectInput
              name="vendor"
              control={control}
              getOptionLabel={(option: any) => option.name}
              getOptionValue={(option: any) => option.value}
              options={data?.usersByPermission?.data as User[]}
              label={t('form:input-label-vendor')}
              required
              isClearable
            />
            <TextArea
              label={t('form:input-description')}
              variant="outline"
              {...register('message')}
              disabled={isLoading || !Boolean(vendor)}
              placeholder="Don't share any personal information here (Optional)"
            />
          </div>
          <Button
            className="mt-3"
            loading={isLoading}
            disabled={isLoading || !Boolean(vendor)}
          >
            {t('text-shop-approve-button')}
          </Button>
        </form>
      )}
    </div>
  );
};

export default TransferShopOwnershipView;
