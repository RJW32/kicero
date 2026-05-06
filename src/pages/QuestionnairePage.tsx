import Questionnaire from '../components/Questionnaire';
import {pageMeta} from '../seo/seoConfig';
import {buildBreadcrumb} from '../seo/structuredData';
import {usePageSeo} from '../seo/usePageSeo';

export default function QuestionnairePage() {
  usePageSeo({
    meta: pageMeta.questionnaire,
    structuredData: [
      buildBreadcrumb([
        {name: 'Home', path: '/'},
        {name: 'Questionnaire', path: '/questionnaire'},
      ]),
    ],
  });

  return <Questionnaire />;
}
