import Card from '@/components/common/card';
import { SaveIcon } from '@/components/icons/save';
import Button from '@/components/ui/button';
import Color from '@/components/ui/color';
import DatePicker from '@/components/ui/date-picker';
import Description from '@/components/ui/description';
import FileInput from '@/components/ui/file-input';
import Input from '@/components/ui/input';
import Range from '@/components/ui/range';
import StickyFooterPanel from '@/components/ui/sticky-footer-panel';
import SwitchInput from '@/components/ui/switch-input';
import TextArea from '@/components/ui/text-area';
import { useSettings } from '@/contexts/settings.context';
import { useUpdateSettingsMutation } from '@/graphql/settings.graphql';
import { useConfirmRedirectIfDirty } from '@/utils/confirmed-redirect-if-dirty';
import { setMaintenanceDetails } from '@/utils/maintenance-utils';
import { prepareSettingsInputData } from '@/utils/prepare-settings-input';
import { yupResolver } from '@hookform/resolvers/yup';
import { Settings } from '__generated__/__types__';
import { addDays } from 'date-fns';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { maintenanceValidationSchema } from './maintenance-validation-schema';

type MaintenanceFormValues = {
  isUnderMaintenance: boolean;
  maintenance: {
    image: any;
    title: string;
    description: string;
    start: string;
    until: string;
    isOverlayColor: boolean;
    overlayColor: string;
    buttonTitleOne: string;
    buttonTitleTwo: string;
    overlayColorRange: string;
    newsLetterTitle: string;
    newsLetterDescription: string;
    aboutUsTitle: string;
    aboutUsDescription: string;
    contactUsTitle: string;
  };
};

type IProps = {
  settings?: Settings | null;
};

export default function MaintenanceSettingsForm({ settings }: IProps) {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const [updateSettingsMutation, { loading }] = useUpdateSettingsMutation();
  const { options: settingOptions } = settings ?? {};
  const { updateSettings } = useSettings();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<MaintenanceFormValues>({
    shouldUnregister: true,
    // @ts-ignore
    resolver: yupResolver(maintenanceValidationSchema),
    //@ts-ignore
    defaultValues: {
      ...settingOptions,
    },
  });

  async function onSubmit(values: MaintenanceFormValues) {
    const inputValues = {
      ...settingOptions,
      isUnderMaintenance: values.isUnderMaintenance,
      maintenance: {
        ...values.maintenance,
        until: new Date(values?.maintenance?.until)?.toISOString(),
        start: new Date(values?.maintenance?.start)?.toISOString(),
      },
    };

    const settingsOptionsInput: any = prepareSettingsInputData(inputValues);
    const updatedData = await updateSettingsMutation({
      variables: {
        input: {
          language: locale!,
          options: settingsOptionsInput,
        },
      },
    });

    if (updatedData) {
      const { isUnderMaintenance = false, maintenance = {} } =
        updatedData?.data?.updateSettings?.options! ?? {};
      updateSettings(updatedData?.data?.updateSettings?.options!);
      setMaintenanceDetails(isUnderMaintenance, maintenance);
      toast.success(t('common:successfully-updated'));
    }

    reset(values, { keepValues: true });
  }
  const isDirty = Object.keys(dirtyFields).length > 0;
  useConfirmRedirectIfDirty({ isDirty });
  const maintenanceImageInformation = (
    <span>
      {t('form:maintenance-cover-image-help-text')} <br />
      {t('form:cover-image-dimension-help-text')} &nbsp;
      <span className="font-bold">1170 x 435{t('common:text-px')}</span>
    </span>
  );
  const startDate = watch('maintenance.start');
  const isOverlayColor = watch('maintenance.isOverlayColor');
  const isMaintenanceMode = watch('isUnderMaintenance');
  const today = new Date();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="my-5 flex flex-wrap border-b border-dashed border-border-base pb-8 sm:my-8">
        <Description
          title={t('form:form-title-information')}
          details={t('form:site-maintenance-info-help-text')}
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="w-full sm:w-8/12 md:w-2/3">
          <div className="mt-5 mb-5">
            <SwitchInput
              name="isUnderMaintenance"
              control={control}
              label={t('form:input-label-enable-maintenance-mode')}
              toolTipText={t('form:input-tooltip-enable-maintenance-mode')}
            />
          </div>
        </Card>
      </div>
      <div className="my-5 flex flex-wrap border-b border-dashed border-border-base pb-8 sm:my-8">
        <Description
          title={t('form:input-label-maintenance-cover-image')}
          details={maintenanceImageInformation}
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="logo-field-area w-full sm:w-8/12 md:w-2/3">
          <FileInput
            name="maintenance.image"
            control={control}
            multiple={false}
            disabled={!isMaintenanceMode}
          />
        </Card>
      </div>

      <div className="my-5 flex flex-wrap border-b border-dashed border-border-base pb-8 sm:my-8">
        <Description
          title={t('form:form-title-maintenance-information')}
          details={t('form:site-maintenance-info-help-text')}
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="w-full sm:w-8/12 md:w-2/3">
          <Input
            label={t('form:input-label-title')}
            toolTipText={t('form:input-tooltip-maintenance-title')}
            {...register('maintenance.title')}
            error={t(errors.maintenance?.title?.message!)}
            variant="outline"
            className="mb-5"
            disabled={!isMaintenanceMode}
            {...(isMaintenanceMode && {
              required: true,
            })}
          />
          <TextArea
            label={t('form:input-label-description')}
            toolTipText={t('form:input-tooltip-maintenance-description')}
            {...register('maintenance.description')}
            error={t(errors.maintenance?.description?.message!)}
            variant="outline"
            className="mb-5 "
            disabled={!isMaintenanceMode}
            {...(isMaintenanceMode && {
              required: true,
            })}
          />
          <div className="mb-5">
            <DatePicker
              control={control}
              name="maintenance.start"
              minDate={today}
              startDate={new Date(startDate)}
              locale={locale}
              placeholder="Start Date"
              disabled={!isMaintenanceMode}
              label={t('form:maintenance-start-time')}
              toolTipText={t('form:input-tooltip-maintenance-start-time')}
              {...(isMaintenanceMode && {
                required: true,
              })}
              error={t(errors.maintenance?.start?.message!)}
            />
          </div>
          <div className="w-full">
            <DatePicker
              control={control}
              name="maintenance.until"
              disabled={!startDate || !isMaintenanceMode}
              minDate={addDays(new Date(startDate), 1)}
              placeholder="End Date"
              locale={locale}
              {...(isMaintenanceMode && {
                required: true,
              })}
              toolTipText={t('form:input-tooltip-maintenance-end-time')}
              label={t('form:maintenance-end-date')}
              error={t(errors.maintenance?.until?.message!)}
            />
          </div>
        </Card>
      </div>

      <div className="my-5 flex flex-wrap border-b border-dashed border-border-base pb-8 sm:my-8">
        <Description
          title="Maintenance mode extra settings"
          details="Add maintenance mode extra settings here."
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="w-full sm:w-8/12 md:w-2/3">
          <div className="mb-5">
            <SwitchInput
              name="maintenance.isOverlayColor"
              control={control}
              disabled={!isMaintenanceMode}
              label="Overlay color enable?"
              toolTipText={t('form:input-tooltip-maintenance-overlay-color')}
            />
          </div>

          {isOverlayColor ? (
            <div className="mb-5">
              <div className="flex flex-col gap-y-4">
                <Color
                  {...register('maintenance.overlayColor')}
                  disabled={!isMaintenanceMode}
                  label="Overlay Color"
                />
                <Range
                  min="0"
                  max="1"
                  step="0.1"
                  {...register('maintenance.overlayColorRange')}
                  disabled={!isMaintenanceMode}
                  label="Alpha"
                />
              </div>
            </div>
          ) : (
            ''
          )}
          <Input
            label="Button Title One"
            toolTipText={t('form:input-tooltip-maintenance-button-one')}
            {...register('maintenance.buttonTitleOne')}
            error={t(errors?.maintenance?.buttonTitleOne?.message!)}
            variant="outline"
            className="mb-5"
            {...(isMaintenanceMode && {
              required: true,
            })}
            disabled={!isMaintenanceMode}
          />
          <Input
            label="Button Title Two"
            toolTipText={t('form:input-tooltip-maintenance-button-two')}
            {...register('maintenance.buttonTitleTwo')}
            error={t(errors?.maintenance?.buttonTitleTwo?.message!)}
            variant="outline"
            {...(isMaintenanceMode && {
              required: true,
            })}
            disabled={!isMaintenanceMode}
          />
        </Card>
      </div>

      <div className="my-5 flex flex-wrap border-b border-dashed border-border-base pb-8 sm:my-8">
        <Description
          title="News letter settings"
          details="Add news letter settings here."
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="w-full sm:w-8/12 md:w-2/3">
          <Input
            label="News letter title."
            toolTipText={t('form:input-tooltip-maintenance-newsletter-title')}
            {...register('maintenance.newsLetterTitle')}
            error={t(errors.maintenance?.newsLetterTitle?.message!)}
            variant="outline"
            className="mb-5"
            {...(isMaintenanceMode && {
              required: true,
            })}
            disabled={!isMaintenanceMode}
          />
          <TextArea
            label={t('form:input-label-description')}
            toolTipText={t(
              'form:input-tooltip-maintenance-newsletter-description',
            )}
            {...register('maintenance.newsLetterDescription')}
            error={t(errors.maintenance?.newsLetterDescription?.message!)}
            variant="outline"
            {...(isMaintenanceMode && {
              required: true,
            })}
            disabled={!isMaintenanceMode}
          />
        </Card>
      </div>

      <div className="my-5 flex flex-wrap border-b border-dashed border-border-base pb-8 sm:my-8">
        <Description
          title="Side bar drawer content"
          details="Add side bar content here."
          className="w-full px-0 pb-5 sm:w-4/12 sm:py-8 sm:pe-4 md:w-1/3 md:pe-5"
        />

        <Card className="w-full sm:w-8/12 md:w-2/3">
          <Input
            label="About us heading."
            toolTipText={t('form:input-tooltip-maintenance-drawer-title')}
            {...register('maintenance.aboutUsTitle')}
            error={t(errors.maintenance?.aboutUsTitle?.message!)}
            variant="outline"
            className="mb-5"
            {...(isMaintenanceMode && {
              required: true,
            })}
            disabled={!isMaintenanceMode}
          />
          <TextArea
            label={t('form:input-label-description')}
            toolTipText={t('form:input-tooltip-maintenance-drawer-description')}
            {...register('maintenance.aboutUsDescription')}
            error={t(errors.maintenance?.aboutUsDescription?.message!)}
            variant="outline"
            className="mb-5"
            {...(isMaintenanceMode && {
              required: true,
            })}
            disabled={!isMaintenanceMode}
          />
          <Input
            label="Contact us heading."
            toolTipText={t('form:input-tooltip-maintenance-contact-us')}
            {...register('maintenance.contactUsTitle')}
            error={t(errors.maintenance?.contactUsTitle?.message!)}
            variant="outline"
            {...(isMaintenanceMode && {
              required: true,
            })}
            disabled={!isMaintenanceMode}
          />
        </Card>
      </div>

      <StickyFooterPanel className="z-0">
        <Button
          loading={loading}
          disabled={loading || !Boolean(isDirty)}
          className="text-sm md:text-base"
        >
          <SaveIcon className="relative top-px h-6 w-6 shrink-0 ltr:mr-2 rtl:pl-2" />
          {t('form:button-label-save-settings')}
        </Button>
      </StickyFooterPanel>
    </form>
  );
}
