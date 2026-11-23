import { Box } from '@mui/material'
import { useLanguage } from '../../i18n'

const reportColumns = [
  ['daughters_0_18', 'daughterAges0to18'],
  ['unmarried_daughters_18_45', 'unmarriedDaughters18to45'],
  ['total_daughters', 'totalDaughters'],
  ['survey_entries', 'surveyEntries']
]

function formatCount(value) {
  return new Intl.NumberFormat('en-IN').format(value)
}

export default function DistrictReport({ report }) {
  const { t } = useLanguage()
  const breakdowns = [
    ['womanCategoryReport', report.breakdowns?.womanCategory],
    ['disabilityTypeReport', report.breakdowns?.disabilityType],
    ['disabilityPercentageReport', report.breakdowns?.disabilityPercentage],
    ['socialCategoryReport', report.breakdowns?.socialCategory],
    ['bplReport', report.breakdowns?.bpl]
  ]

  return (
    <Box className="district-report-stack">
      <section className="table-card district-report-card">
        <div className="section-heading">
          <div><p>{t('reports')}</p><h2>{t('districtReportTitle')}</h2></div>
        </div>
        <Box className="modern-table-wrap">
          <table className="modern-table district-report-table">
            <thead>
              <tr>
                <th>{t('districtReportDistrict')}</th>
                {reportColumns.map(([, label]) => <th key={label}>{t(label)}</th>)}
              </tr>
            </thead>
            <tbody>
              {report.rows.map(row => (
                <tr key={row.district}>
                  <td>{row.district === 'Lahaul & Spiti' ? 'Lahaul and Spiti' : row.district}</td>
                  {reportColumns.map(([field]) => <td key={field}>{formatCount(row[field])}</td>)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>{t('grandTotal')}</th>
                {reportColumns.map(([field]) => <th key={field}>{formatCount(report.grandTotal[field])}</th>)}
              </tr>
            </tfoot>
          </table>
        </Box>
      </section>

      <Box className="report-breakdown-grid">
        {breakdowns.map(([title, rows]) => (
          <section className="table-card report-breakdown-card" key={title}>
            <div className="section-heading">
              <div><p>{t('reports')}</p><h2>{t(title)}</h2></div>
            </div>
            <Box className="modern-table-wrap">
              <table className="modern-table">
                <thead><tr><th>{t('reportCategory')}</th><th>{t('reportCount')}</th></tr></thead>
                <tbody>
                  {rows?.map(row => (
                    <tr key={row.label}><td>{row.label}</td><td>{formatCount(row.count)}</td></tr>
                  ))}
                  {!rows?.length && <tr><td colSpan="2" className="empty-state">{t('noReportData')}</td></tr>}
                </tbody>
              </table>
            </Box>
          </section>
        ))}
      </Box>
    </Box>
  )
}
