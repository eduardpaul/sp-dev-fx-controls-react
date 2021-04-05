import * as React from 'react';
import { mergeStyleSets } from 'office-ui-fabric-react/lib/Styling';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { ISite, ISitePickerProps } from './ISitePicker';
import { getAllSites, getHubSites } from '../../services/SPSitesService';
import { IDropdownOption, Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { ISelectableOption, SelectableOptionMenuItemType } from 'office-ui-fabric-react/lib/utilities/selectableOption/SelectableOption.types';
import orderBy from 'lodash/orderBy';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';
import { toRelativeUrl } from '../../common/utilities/GeneralHelper';

const styles = mergeStyleSets({
  loadingSpinnerContainer: {
    width: '100%',
    textAlign: 'center'
  },
  siteOption: {
    display: 'flex',
    whiteSpace: 'nowrap',
    alignItems: 'center'
  },
  siteOptionCheckbox: {
    display: 'inline-block',
    marginRight: '4px'
  },
  siteOptionContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '0',
    padding: '4px 0'
  },
  siteOptionTitle: {
    lineHeight: '18px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  siteOptionUrl: {
    fontSize: '12px',
    lineHeight: '14px',
    fontWeight: '300',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
});

export const SitePicker: React.FunctionComponent<ISitePickerProps> = (props: React.PropsWithChildren<ISitePickerProps>) => {

  const {
    label,
    disabled,
    context,
    initialSites,
    multiSelect,
    mode,
    limitToCurrentSiteCollection,
    allowSearch,
    orderBy: propOrderBy,
    isDesc,
    onChange
  } = props;

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [selectedSites, setSelectedSites] = React.useState<ISite[]>();
  const [allSites, setAllSites] = React.useState<ISite[]>();
  const [filteredSites, setFilteredSites] = React.useState<ISite[]>();
  const [searchQuery, setSearchQuery] = React.useState<string>();

  const onRenderOption = (option?: ISelectableOption, defaultRender?: (props?: ISelectableOption) => JSX.Element | null): JSX.Element | null => {
    if (!props) {
      return null;
    }

    if (option.itemType === SelectableOptionMenuItemType.Header) {
      return <SearchBox />;
    }
    // {multiSelect !== false && <Checkbox className={styles.siteOptionCheckbox} checked={option.selected} disabled={option.disabled} />}
    return <div className={styles.siteOption}>
      <div className={styles.siteOptionContent}>
        <span className={styles.siteOptionTitle}>{option.text}</span>
        <span className={styles.siteOptionUrl}>{toRelativeUrl(option.data!.url)}</span>
      </div>
    </div>;
  };

  const getOptions = (): IDropdownOption[] => {
    const result: IDropdownOption[] = [];

    if (allowSearch) {
      result.push({
        key: 'search',
        text: '',
        itemType: SelectableOptionMenuItemType.Header
      });
    }

    const selectedSitesIds: string[] = selectedSites ? selectedSites.map(s => s.id!) : [];

    if (filteredSites) {
      filteredSites.forEach(s => {
        result.push({
          key: s.id,
          text: s.title,
          data: s,
          selected: selectedSitesIds.indexOf(s.id) !== -1
        });
      });
    }

    return result;
  };

  React.useEffect(() => {
    if (!initialSites) {
      return;
    }

    setSelectedSites(sites => {
      if (!sites) { // we want to set the state one time only
        return initialSites;
      }

      return sites;
    });
  }, [initialSites]);

  React.useEffect(() => {
    if (!context) {
      return;
    }

    setIsLoading(true);
    setSearchQuery('');
    setFilteredSites([]);

    let promise: Promise<ISite[]>;
    if (mode === 'hub') {
      promise = getHubSites(context);
    }
    else {
      promise = getAllSites(context, mode === 'web', limitToCurrentSiteCollection);
    }

    promise.then(sites => {
      const copy = orderBy(sites, [propOrderBy || 'title'], [isDesc ? 'desc' : 'asc']);
      setAllSites(copy);
      setIsLoading(false);
    });
  }, [context, mode, limitToCurrentSiteCollection]);

  React.useEffect(() => {
    setAllSites(sites => {
      if (!sites) {
        return sites;
      }

      const copy = orderBy(sites, [propOrderBy || 'title'], [isDesc ? 'desc' : 'asc']);
      return copy;
    });
  }, [propOrderBy, isDesc]);

  React.useEffect(() => {
    if (!allSites) {
      return;
    }
    setFilteredSites([...allSites]);
  }, [allSites]);

  if (isLoading) {
    return <div className={styles.loadingSpinnerContainer}>
      <Spinner size={SpinnerSize.medium} />
    </div>;
  }

  return (
    <>
      <Dropdown
        label={label}
        options={getOptions()}
        disabled={disabled}
        multiSelect={multiSelect !== false}
        onRenderOption={onRenderOption}
      />
    </>
  );
};
