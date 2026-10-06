import React from 'react';
import { Scale, ShieldCheck, Award, BookOpen, CheckCircle2, Building, Gavel } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Chambers Heritage & Principles
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          About B. B. Bale & Co. Chambers
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Founded on principles of unwavering integrity, procedural mastery, and dedicated advocacy under the Legal Practitioners Act of the Federal Republic of Nigeria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            A Legacy of Appellate Rigor & Substantive Justice
          </h2>
          <p>
            B. B. BALE & CO. CHAMBERS was established to provide distinguished corporate entities, institutions, and individuals with uncompromising legal defense and advisory services. From our principal chambers in the Federal Capital Territory, Abuja, our footprint extends across commercial hubs in Lagos, Kano, and Port Harcourt.
          </p>
          <p>
            Our trial and appellate practice is built on comprehensive statutory analysis, painstaking factual investigation, and respectful yet incisive courtroom advocacy. We maintain an exhaustive law library spanning classic common law authorities, Nigerian Supreme Court decisions, and authentic Islamic jurisprudence.
          </p>
          <div className="p-4 bg-amber-50 border-l-4 border-amber-600 rounded-r-lg">
            <p className="font-serif italic text-amber-950 text-sm">
              "We regard the law not merely as a profession, but as a sacred trust committed to the protection of right, the enforcement of covenant, and the restraint of injustice."
            </p>
            <p className="text-xs font-bold text-amber-800 mt-2">— Barrister B. B. Bale, SAN</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <Scale className="w-8 h-8 text-amber-700" />
            <h3 className="font-serif font-bold text-base text-slate-900">Supreme Advocacy</h3>
            <p className="text-xs text-slate-600">Appearances before the Supreme Court of Nigeria and the Court of Appeal.</p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <Building className="w-8 h-8 text-amber-700" />
            <h3 className="font-serif font-bold text-base text-slate-900">Property Governance</h3>
            <p className="text-xs text-slate-600">Statutory tenancy drafting, estate administration, and premises recovery.</p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <BookOpen className="w-8 h-8 text-amber-700" />
            <h3 className="font-serif font-bold text-base text-slate-900">Sharia Jurisprudence</h3>
            <p className="text-xs text-slate-600">Islamic inheritance (Mirath), estate devolution, and family dispute resolution.</p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <ShieldCheck className="w-8 h-8 text-amber-700" />
            <h3 className="font-serif font-bold text-base text-slate-900">Privileged Security</h3>
            <p className="text-xs text-slate-600">Strict client-matter data isolation and digital management systems.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PracticeAreasPage: React.FC = () => {
  const practiceAreas = [
    {
      title: 'Litigation & Appellate Advocacy',
      description: 'Representation in civil, constitutional, criminal, and commercial matters across the Supreme Court of Nigeria, Court of Appeal, Federal High Court, and State High Courts.',
      details: ['Appellate Briefs & Oral Arguments', 'Constitutional & Human Rights Enforcement', 'Commercial Injunctions & Interlocutory Relief', 'Trial Advocacy before Federal & State Benches']
    },
    {
      title: 'Property & Recovery of Premises',
      description: 'Tenancy governance, lease drafting, title perfection at Land Registries, and statutory recovery of premises actions in compliance with State Tenancy Laws.',
      details: ['Statutory Notices (Quit Notice & 7-Day Owner Intent)', 'Recovery Proceedings before Magistrate & High Courts', 'Deed of Assignment & Governor’s Consent Processing', 'Land Title Dispute Litigation']
    },
    {
      title: 'Islamic Law & Sharia Jurisprudence',
      description: 'Comprehensive advisory and trial representation before Upper Sharia Courts and Sharia Courts of Appeal on estate distribution (Mirath) and Islamic family law.',
      details: ['Estate Succession & Mirath Mathematical Distribution', 'Islamic Marriage, Custody (Hadanah) & Matrimonial Causes', 'Waqf & Charitable Endowment Structuring', 'Appeals from Upper Sharia Courts']
    },
    {
      title: 'Corporate & Commercial Practice',
      description: 'Corporate formation, Corporate Affairs Commission (CAC) governance, shareholder agreements, debt recovery litigation, and contract negotiation.',
      details: ['CAC Corporate Registrations & Annual Returns', 'Commercial Joint Ventures & Shareholder Pacts', 'Secured Credit & Banking Debt Recovery', 'Employment & Trade Union Litigation at NICN']
    },
    {
      title: 'Energy, Oil & Gas Advisory',
      description: 'Advisory on the Petroleum Industry Act 2021 (PIA), host community development trusts, gas sale agreements, and environmental compliance litigation.',
      details: ['PIA Upstream & Midstream Licensing Advisory', 'Host Community Development Trusts Incorporation', 'Gas Sale & Transportation Agreements', 'Oil Spill & Environmental Damage Litigation']
    },
    {
      title: 'Arbitration & Alternative Dispute Resolution',
      description: 'Domestic and international commercial arbitration under the Arbitration and Mediation Act 2023, conciliation, and court-connected mediation.',
      details: ['Arbitral Tribunal Proceedings & Awards', 'Enforcement & Setting Aside of Arbitral Awards', 'Court-Connected Multi-Door Courthouse Mediation', 'Negotiated Commercial Settlement Agreements']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-14">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-serif uppercase tracking-widest text-amber-700 font-bold">
          Chambers Competence & Scope
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Chambers Practice Areas
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Detailed practice disciplines under Nigerian substantive and procedural laws, tailored to the specific jurisdictional provisions of each State and the Federation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {practiceAreas.map((pa, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-serif font-bold text-base mb-3 border border-amber-200">
                0{idx + 1}
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-950 mb-2">{pa.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{pa.description}</p>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {pa.details.map((d, dIdx) => (
                  <li key={dIdx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-amber-800 font-semibold font-serif">
              Subject to review and conduct by Counsel.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
