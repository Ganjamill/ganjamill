import Link from 'next/link';
import { Routes } from '@/config/routes';
import { ChevronLeft } from '@/components/icons/chevron-left';
import { useForm } from 'react-hook-form';
import SelectInput from '@/components/ui/select-input';
import ValidationError from '@/components/ui/form-validation-error';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import { isEmpty } from 'lodash';
import { twMerge } from 'tailwind-merge';
import classNames from 'classnames';
import { getAuthCredentials } from '@/utils/auth-utils';
import { SUPER_ADMIN } from '@/utils/constants';
import { OwnershipTransfer } from '__generated__/__types__';
import { useUpdateOwnershipTransferMutation } from '@/graphql/ownership-transfer.graphql';
import { OwnerShipTransferStatus } from '@/types/custom-types';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { Config } from '@/config';

type FormValues = {
  status: any;
};

const STATUS = [
  { name: 'text-pending', value: 'pending', serial: 1 },
  { name: 'text-processing', value: 'processing', serial: 2 },
  { name: 'text-rejected', value: 'rejected', serial: 3 },
];

const APPROVED_STATUS = [
  { name: 'text-processing', value: 'processing', serial: 2 },
  { name: 'text-approved', value: 'approved', serial: 3 },
  { name: 'text-rejected', value: 'rejected', serial: 4 },
];
const Header = ({
  data,
  className,
  ...rest
}: {
  data: OwnershipTransfer;
  className?: string;
}) => {
  const router = useRouter();
  const generateRedirectUrl = router.query.shop
    ? `/${Routes.ownershipTransferRequest.list}`
    : Routes.ownershipTransferRequest.list;
  const { t } = useTranslation();
  const [updateOwnerShipTransferStatus, { loading: updating }] =
    useUpdateOwnershipTransferMutation({
      onCompleted() {
        router.push(generateRedirectUrl, undefined, {
          locale: Config.defaultLanguage,
        });
      },
    });
  const { permissions } = getAuthCredentials();
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    shouldUnregister: true,
    ...(data && {
      defaultValues: {
        status: STATUS.find(
          (item) => item?.value?.toUpperCase() === data?.status?.toUpperCase(),
        ),
      },
    }),
  });

  const changeStatus = async ({ status }: FormValues) => {
    updateOwnerShipTransferStatus({
      variables: {
        input: {
          id: data?.id,
          status: status?.value,
        },
      },
    });
    // await router.push(generateRedirectUrl, undefined, {
    //   locale: Config.defaultLanguage,
    // });
  };
  return (
    <div
      className={twMerge(
        classNames('flex flex-col 2xl:items-center 2xl:flex-row', className),
      )}
      {...rest}
    >
      <h3 className="mb-8 w-full whitespace-nowrap text-center 2xl:text-2xl xl:text-xl text-base font-semibold text-heading 2xl:mb-0 2xl:w-1/3 2xl:text-start flex items-center gap-2">
        <Link
          href={
            permissions?.includes(SUPER_ADMIN)
              ? Routes.ownershipTransferRequest.list
              : Routes?.ownerDashboardShopTransferRequest
          }
        >
          <ChevronLeft height="1em" width="1em" className="text-[#9CA3AF]" />
        </Link>
        Shop Transfer ID - #{data?.transaction_identifier}
      </h3>

      {permissions?.includes(SUPER_ADMIN) &&
        OwnerShipTransferStatus?.APPROVED !== data?.status &&
        OwnerShipTransferStatus?.REJECTED !== data?.status && (
          <form
            onSubmit={handleSubmit(changeStatus)}
            className="flex w-full flex-col ms-auto sm:flex-row 2xl:justify-end 2xl:w-1/2"
          >
            <div className="z-20 w-full me-5 2xl:max-w-[280px]">
              {OwnerShipTransferStatus?.PENDING !== data?.status ? (
                <SelectInput
                  name="status"
                  control={control}
                  getOptionLabel={(option: any) => t(option.name)}
                  getOptionValue={(option: any) => option.value}
                  options={APPROVED_STATUS}
                />
              ) : (
                <SelectInput
                  name="status"
                  control={control}
                  getOptionLabel={(option: any) => t(option.name)}
                  getOptionValue={(option: any) => option.value}
                  options={STATUS}
                />
              )}

              {errors?.status?.message ? (
                <ValidationError message={t(errors?.status?.message)} />
              ) : (
                ''
              )}
            </div>
            <Button
              loading={updating}
              disabled={
                Boolean(data?.order_info?.pending) ||
                Boolean(data?.order_info?.processing) ||
                Boolean(data?.order_info?.localFacility) ||
                Boolean(data?.order_info?.outForDelivery) ||
                !isEmpty(data?.refund_info) ||
                !isEmpty(data?.withdrawal_info) ||
                Number(data?.balance_info?.current_balance) > 1 ||
                updating
              }
              className="mt-2 w-full sm:mt-0 sm:w-auto"
            >
              <span className="hidden sm:block">
                {t('form:button-label-change-status')}
              </span>
              <span className="block sm:hidden">
                {t('form:button-label-change')}
              </span>
            </Button>
          </form>
        )}
    </div>
  );
};

export { Header };
